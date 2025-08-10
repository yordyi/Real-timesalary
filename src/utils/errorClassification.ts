export enum SubdomainErrorType {
  SSL_CERTIFICATE = 'SSL_CERTIFICATE',
  DNS_RESOLUTION = 'DNS_RESOLUTION',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  SUBDOMAIN_NOT_FOUND = 'SUBDOMAIN_NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_SECURITY = 'BROWSER_SECURITY',
  UNKNOWN = 'UNKNOWN'
}

export interface SubdomainError {
  type: SubdomainErrorType
  message: string
  userMessage: string
  canRetry: boolean
  suggestedAction: string
  fallbackAvailable: boolean
}

export class SubdomainErrorClassifier {
  static classifyError(error: Error | string): SubdomainError {
    const errorMessage = typeof error === 'string' ? error : error.message
    const lowerMessage = errorMessage.toLowerCase()
    
    // SSL Certificate Errors
    if (this.isSSLError(lowerMessage)) {
      return {
        type: SubdomainErrorType.SSL_CERTIFICATE,
        message: errorMessage,
        userMessage: '子域名SSL证书配置有问题',
        canRetry: false,
        suggestedAction: '请检查子域名的SSL证书配置，或使用主域名访问',
        fallbackAvailable: true
      }
    }
    
    // DNS Resolution Errors
    if (this.isDNSError(lowerMessage)) {
      return {
        type: SubdomainErrorType.DNS_RESOLUTION,
        message: errorMessage,
        userMessage: '子域名DNS解析失败',
        canRetry: true,
        suggestedAction: '请检查网络连接，或稍后再试',
        fallbackAvailable: true
      }
    }
    
    // Server Errors (5xx) - Check before timeout to catch "Gateway Timeout"
    if (this.isServerError(lowerMessage)) {
      return {
        type: SubdomainErrorType.SERVER_ERROR,
        message: errorMessage,
        userMessage: '服务器错误',
        canRetry: true,
        suggestedAction: '服务器暂时不可用，请稍后再试',
        fallbackAvailable: true
      }
    }
    
    // Connection Timeout Errors
    if (this.isTimeoutError(lowerMessage)) {
      return {
        type: SubdomainErrorType.CONNECTION_TIMEOUT,
        message: errorMessage,
        userMessage: '连接超时',
        canRetry: true,
        suggestedAction: '请检查网络连接，或稍后再试',
        fallbackAvailable: true
      }
    }
    
    // Browser Security Errors
    if (this.isBrowserSecurityError(lowerMessage)) {
      return {
        type: SubdomainErrorType.BROWSER_SECURITY,
        message: errorMessage,
        userMessage: '浏览器安全限制',
        canRetry: false,
        suggestedAction: '请尝试使用不同的浏览器，或使用主域名访问',
        fallbackAvailable: true
      }
    }
    
    // Network Errors
    if (this.isNetworkError(lowerMessage)) {
      return {
        type: SubdomainErrorType.NETWORK_ERROR,
        message: errorMessage,
        userMessage: '网络连接错误',
        canRetry: true,
        suggestedAction: '请检查网络连接',
        fallbackAvailable: true
      }
    }
    
    // Default to unknown error
    return {
      type: SubdomainErrorType.UNKNOWN,
      message: errorMessage,
      userMessage: '未知错误',
      canRetry: true,
      suggestedAction: '请刷新页面或稍后再试',
      fallbackAvailable: true
    }
  }
  
  private static isSSLError(message: string): boolean {
    const sslKeywords = [
      'ssl', 'tls', 'certificate', 'cert', 'https',
      'secure connection', 'security certificate',
      'untrusted certificate', 'certificate error',
      'ssl_error', 'tls_error', 'certificate_verify_failed'
    ]
    
    return sslKeywords.some(keyword => message.includes(keyword))
  }
  
  private static isDNSError(message: string): boolean {
    const dnsKeywords = [
      'dns', 'nxdomain', 'name resolution',
      'dns_probe_finished_nxdomain', 'dns resolution',
      'domain not found', 'host not found',
      'name or service not known', 'nodename nor servname provided'
    ]
    
    return dnsKeywords.some(keyword => message.includes(keyword))
  }
  
  private static isTimeoutError(message: string): boolean {
    const timeoutKeywords = [
      'timeout', 'timed out', 'connection timeout',
      'request timeout', 'response timeout',
      'etimedout', 'connection_timeout'
    ]
    
    return timeoutKeywords.some(keyword => message.includes(keyword))
  }
  
  private static isBrowserSecurityError(message: string): boolean {
    const securityKeywords = [
      'cors', 'cross-origin', 'security policy',
      'mixed content', 'insecure request',
      'blocked by client', 'security error',
      'same-origin policy', 'content security policy'
    ]
    
    return securityKeywords.some(keyword => message.includes(keyword))
  }
  
  private static isServerError(message: string): boolean {
    const serverKeywords = [
      '500', '502', '503', '504', '505',
      'internal server error', 'bad gateway',
      'service unavailable', 'gateway timeout',
      'server error', 'upstream error'
    ]
    
    return serverKeywords.some(keyword => message.includes(keyword))
  }
  
  private static isNetworkError(message: string): boolean {
    const networkKeywords = [
      'network', 'connection refused', 'connection reset',
      'no internet', 'offline', 'fetch error',
      'network request failed', 'connection error',
      'econnrefused', 'econnreset', 'enetunreach'
    ]
    
    return networkKeywords.some(keyword => message.includes(keyword))
  }
  
  static getRetryDelay(errorType: SubdomainErrorType, attemptCount: number): number {
    const baseDelays = {
      [SubdomainErrorType.SSL_CERTIFICATE]: 0, // No retry
      [SubdomainErrorType.DNS_RESOLUTION]: 2000,
      [SubdomainErrorType.CONNECTION_TIMEOUT]: 5000,
      [SubdomainErrorType.SUBDOMAIN_NOT_FOUND]: 0, // No retry
      [SubdomainErrorType.SERVER_ERROR]: 3000,
      [SubdomainErrorType.NETWORK_ERROR]: 2000,
      [SubdomainErrorType.BROWSER_SECURITY]: 0, // No retry
      [SubdomainErrorType.UNKNOWN]: 1000
    }
    
    const baseDelay = baseDelays[errorType]
    if (baseDelay === 0) return 0
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, Math.min(attemptCount - 1, 4))
    const jitter = Math.random() * 1000
    
    return exponentialDelay + jitter
  }
  
  static shouldRetry(errorType: SubdomainErrorType, attemptCount: number): boolean {
    const maxRetries = {
      [SubdomainErrorType.SSL_CERTIFICATE]: 0,
      [SubdomainErrorType.DNS_RESOLUTION]: 3,
      [SubdomainErrorType.CONNECTION_TIMEOUT]: 3,
      [SubdomainErrorType.SUBDOMAIN_NOT_FOUND]: 0,
      [SubdomainErrorType.SERVER_ERROR]: 3,
      [SubdomainErrorType.NETWORK_ERROR]: 3,
      [SubdomainErrorType.BROWSER_SECURITY]: 0,
      [SubdomainErrorType.UNKNOWN]: 2
    }
    
    return attemptCount <= maxRetries[errorType]
  }
}