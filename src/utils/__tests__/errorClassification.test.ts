import { SubdomainErrorClassifier, SubdomainErrorType } from '../errorClassification'

describe('SubdomainErrorClassifier', () => {
  describe('classifyError', () => {
    it('should classify SSL certificate errors correctly', () => {
      const sslErrors = [
        'SSL certificate error',
        'HTTPS connection failed',
        'Certificate verify failed',
        'TLS handshake failed',
        'Untrusted certificate'
      ]
      
      sslErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.SSL_CERTIFICATE)
        expect(result.canRetry).toBe(false)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('子域名SSL证书配置有问题')
      })
    })
    
    it('should classify DNS resolution errors correctly', () => {
      const dnsErrors = [
        'DNS_PROBE_FINISHED_NXDOMAIN',
        'DNS resolution failed',
        'Domain not found',
        'Host not found',
        'Name or service not known'
      ]
      
      dnsErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.DNS_RESOLUTION)
        expect(result.canRetry).toBe(true)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('子域名DNS解析失败')
      })
    })
    
    it('should classify connection timeout errors correctly', () => {
      const timeoutErrors = [
        'Connection timeout',
        'Request timed out',
        'Response timeout',
        'ETIMEDOUT',
        'Connection_timeout'
      ]
      
      timeoutErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.CONNECTION_TIMEOUT)
        expect(result.canRetry).toBe(true)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('连接超时')
      })
    })
    
    it('should classify browser security errors correctly', () => {
      const securityErrors = [
        'CORS policy blocked',
        'Cross-origin request blocked',
        'Mixed content error',
        'Security policy violation',
        'Same-origin policy error'
      ]
      
      securityErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.BROWSER_SECURITY)
        expect(result.canRetry).toBe(false)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('浏览器安全限制')
      })
    })
    
    it('should classify server errors correctly', () => {
      const serverErrors = [
        '500 Internal Server Error',
        '502 Bad Gateway',
        '503 Service Unavailable',
        '504 Gateway Timeout',
        'Server error occurred'
      ]
      
      serverErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.SERVER_ERROR)
        expect(result.canRetry).toBe(true)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('服务器错误')
      })
    })
    
    it('should classify network errors correctly', () => {
      const networkErrors = [
        'Network error',
        'Connection refused',
        'Connection reset',
        'No internet connection',
        'Fetch error occurred'
      ]
      
      networkErrors.forEach(errorMessage => {
        const result = SubdomainErrorClassifier.classifyError(errorMessage)
        expect(result.type).toBe(SubdomainErrorType.NETWORK_ERROR)
        expect(result.canRetry).toBe(true)
        expect(result.fallbackAvailable).toBe(true)
        expect(result.userMessage).toBe('网络连接错误')
      })
    })
    
    it('should handle Error objects', () => {
      const error = new Error('SSL certificate error')
      const result = SubdomainErrorClassifier.classifyError(error)
      expect(result.type).toBe(SubdomainErrorType.SSL_CERTIFICATE)
      expect(result.message).toBe('SSL certificate error')
    })
    
    it('should classify unknown errors', () => {
      const unknownError = 'Some random error message'
      const result = SubdomainErrorClassifier.classifyError(unknownError)
      expect(result.type).toBe(SubdomainErrorType.UNKNOWN)
      expect(result.canRetry).toBe(true)
      expect(result.fallbackAvailable).toBe(true)
      expect(result.userMessage).toBe('未知错误')
    })
  })
  
  describe('getRetryDelay', () => {
    it('should return 0 for non-retryable errors', () => {
      expect(SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.SSL_CERTIFICATE, 1)).toBe(0)
      expect(SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.BROWSER_SECURITY, 1)).toBe(0)
      expect(SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.SUBDOMAIN_NOT_FOUND, 1)).toBe(0)
    })
    
    it('should return increasing delays with exponential backoff', () => {
      const firstDelay = SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 1)
      const secondDelay = SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 2)
      const thirdDelay = SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 3)
      
      expect(secondDelay).toBeGreaterThan(firstDelay)
      expect(thirdDelay).toBeGreaterThan(secondDelay)
    })
    
    it('should include jitter in delay calculations', () => {
      const delays = Array.from({ length: 10 }, () => 
        SubdomainErrorClassifier.getRetryDelay(SubdomainErrorType.DNS_RESOLUTION, 1)
      )
      
      // With jitter, delays should be different
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })
  })
  
  describe('shouldRetry', () => {
    it('should not retry non-retryable error types', () => {
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.SSL_CERTIFICATE, 1)).toBe(false)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.BROWSER_SECURITY, 1)).toBe(false)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.SUBDOMAIN_NOT_FOUND, 1)).toBe(false)
    })
    
    it('should retry retryable errors within limits', () => {
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 1)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 2)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 3)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.DNS_RESOLUTION, 4)).toBe(false)
    })
    
    it('should respect different retry limits for different error types', () => {
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.NETWORK_ERROR, 3)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.NETWORK_ERROR, 4)).toBe(false)
      
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.UNKNOWN, 2)).toBe(true)
      expect(SubdomainErrorClassifier.shouldRetry(SubdomainErrorType.UNKNOWN, 3)).toBe(false)
    })
  })
})