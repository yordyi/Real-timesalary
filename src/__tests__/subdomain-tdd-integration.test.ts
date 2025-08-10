import { SubdomainErrorClassifier, SubdomainErrorType } from '@/utils/errorClassification'
import { UserService } from '@/lib/userService'
import { getSubdomainFromHost } from '@/lib/subdomainUtils'

describe('Subdomain TDD Integration', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
  })

  describe('Error Classification System', () => {
    it('should correctly identify and handle Safari SSL errors', () => {
      const safariSSLError = 'Safari浏览器无法打开页面 SSL certificate error'
      const result = SubdomainErrorClassifier.classifyError(safariSSLError)
      
      expect(result.type).toBe(SubdomainErrorType.SSL_CERTIFICATE)
      expect(result.canRetry).toBe(false)
      expect(result.fallbackAvailable).toBe(true)
      expect(result.userMessage).toBe('子域名SSL证书配置有问题')
    })

    it('should provide appropriate retry strategies', () => {
      // Test non-retryable error
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.SSL_CERTIFICATE, 1)).toBe(false)
      
      // Test retryable error within limits
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 1)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 2)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 3)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 4)).toBe(false)
    })

    it('should calculate exponential backoff delays', () => {
      const delay1 = SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 1)
      const delay2 = SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 2)
      
      expect(delay1).toBeGreaterThan(0)
      expect(delay2).toBeGreaterThan(delay1)
      
      // Non-retryable errors should have 0 delay
      expect(SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.SSL_CERTIFICATE, 1)).toBe(0)
    })
  })

  describe('User and Subdomain Management', () => {
    it('should create users with valid subdomains', () => {
      const user = UserService.createUser('shuaihao', 'shuaihao@example.com')
      
      expect(user.username).toBe('shuaihao')
      expect(user.subdomain).toBe('shuaihao')
      expect(user.email).toBe('shuaihao@example.com')
      expect(user.id).toBeDefined()
      expect(user.salaryConfig).toBeDefined()
    })

    it('should handle subdomain conflicts gracefully', () => {
      const user1 = UserService.createUser('testuser')
      const user2 = UserService.createUser('testuser')
      
      expect(user1.subdomain).toBe('testuser')
      expect(user2.subdomain).toBe('testuser1')
      expect(user1.subdomain).not.toBe(user2.subdomain)
    })

    it('should parse subdomains correctly for wanderhubt.com', () => {
      // Production domain parsing
      const prodSubdomain = getSubdomainFromHost('shuaihao.real-timesalary.wanderhubt.com')
      expect(prodSubdomain).toBe('shuaihao')
      
      // Main domain should return null
      const mainDomain = getSubdomainFromHost('real-timesalary.wanderhubt.com')
      expect(mainDomain).toBe(null)
      
      // Localhost development
      const localSubdomain = getSubdomainFromHost('testuser.localhost:3000')
      expect(localSubdomain).toBe('testuser')
    })
  })

  describe('End-to-End Subdomain Flow', () => {
    it('should complete full subdomain error handling workflow', () => {
      // Step 1: Create user and subdomain
      const user = UserService.createUser('demo', 'demo@test.com')
      
      // Step 2: Simulate subdomain access
      const foundUser = UserService.getUserBySubdomain('demo')
      expect(foundUser).toEqual(user)
      
      // Step 3: Simulate SSL error
      const sslError = 'SSL certificate verification failed for subdomain'
      const errorClassification = SubdomainErrorClassifier.classifyError(sslError)
      
      // Step 4: Verify error handling
      expect(errorClassification.type).toBe(SubdomainErrorType.SSL_CERTIFICATE)
      expect(errorClassification.fallbackAvailable).toBe(true)
      expect(errorClassification.canRetry).toBe(false)
      
      // Step 5: Verify no retry should be attempted
      expect(SubdomainErrorClassifier.shouldRetry(errorClassification.type, 1)).toBe(false)
      
      // This represents the complete flow that would trigger fallback UI
      expect(errorClassification.suggestedAction).toContain('主域名访问')
    })
  })

  describe('Real-world Error Scenarios', () => {
    const realWorldErrors = [
      {
        name: 'Safari SSL Certificate Error',
        error: 'Safari浏览器无法打开页面，因为Safari无法验证服务器身份',
        expectedType: SubdomainErrorType.SSL_CERTIFICATE,
        shouldRetry: false
      },
      {
        name: 'Chrome DNS Error',
        error: 'DNS_PROBE_FINISHED_NXDOMAIN',
        expectedType: SubdomainErrorType.DNS_RESOLUTION,
        shouldRetry: true
      },
      {
        name: 'Firefox Connection Timeout',
        error: 'The connection to the server was reset while the page was loading',
        expectedType: SubdomainErrorType.NETWORK_ERROR,
        shouldRetry: true
      },
      {
        name: 'Edge Security Policy',
        error: 'Mixed Content: This request has been blocked; the content must be served over HTTPS',
        expectedType: SubdomainErrorType.BROWSER_SECURITY,
        shouldRetry: false
      }
    ]

    realWorldErrors.forEach(({ name, error, expectedType, shouldRetry }) => {
      it(`should handle ${name} correctly`, () => {
        const result = SubdomainErrorClassifier.classifyError(error)
        
        expect(result.type).toBe(expectedType)
        expect(result.canRetry).toBe(shouldRetry)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBeDefined()
        expect(result.suggestedAction).toBeDefined()
      })
    })
  })
})