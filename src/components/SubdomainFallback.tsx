'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SubdomainHealthChecker, SubdomainHealthStatus } from './SubdomainHealthChecker'
import { SubdomainErrorType } from '@/utils/errorClassification'

interface SubdomainFallbackProps {
  subdomain: string
  host: string
  onFallbackActivated?: (reason: string) => void
  children: React.ReactNode
  fallbackDelay?: number
  showHealthStatus?: boolean
}

export const SubdomainFallback: React.FC<SubdomainFallbackProps> = ({
  subdomain,
  host,
  onFallbackActivated,
  children,
  fallbackDelay = 5000, // 5 seconds default
  showHealthStatus = true
}) => {
  const [showFallback, setShowFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string>('')
  const [healthStatus, setHealthStatus] = useState<SubdomainHealthStatus | null>(null)
  const router = useRouter()

  const handleHealthStatusChange = (status: SubdomainHealthStatus) => {
    setHealthStatus(status)
    
    if (!status.isHealthy && status.error) {
      const error = status.error
      
      // Determine if we should show fallback immediately or after delay
      const shouldFallbackImmediately = [
        SubdomainErrorType.SSL_CERTIFICATE,
        SubdomainErrorType.BROWSER_SECURITY,
        SubdomainErrorType.SUBDOMAIN_NOT_FOUND
      ].includes(error.type)
      
      const reason = error.userMessage
      setFallbackReason(reason)
      
      if (shouldFallbackImmediately) {
        setShowFallback(true)
        onFallbackActivated?.(reason)
      } else if (error.fallbackAvailable && status.attemptCount >= 2) {
        // Show fallback after multiple attempts for retryable errors
        setTimeout(() => {
          setShowFallback(true)
          onFallbackActivated?.(reason)
        }, fallbackDelay)
      }
    } else if (status.isHealthy && showFallback) {
      // Health restored, hide fallback
      setShowFallback(false)
      setFallbackReason('')
    }
  }

  const redirectToMainDomain = () => {
    const mainDomain = host.includes('localhost') 
      ? `http://${host}`
      : `https://${host.replace(/^[^.]+\./, '')}`
    
    const currentParams = new URLSearchParams(window.location.search)
    currentParams.set('user', subdomain)
    
    const redirectUrl = `${mainDomain}?${currentParams.toString()}`
    router.push(redirectUrl)
  }

  const copyMainDomainLink = async () => {
    const mainDomain = host.includes('localhost')
      ? `http://${host}`
      : `https://${host.replace(/^[^.]+\./, '')}`
    
    const linkWithUser = `${mainDomain}?user=${subdomain}`
    
    try {
      await navigator.clipboard.writeText(linkWithUser)
      // Could show a toast notification here
      alert('主域名链接已复制到剪贴板')
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  if (showFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              子域名访问异常
            </h2>
            <p className="text-gray-600 mb-4">
              {fallbackReason}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={redirectToMainDomain}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              使用主域名访问
            </button>
            
            <button
              onClick={copyMainDomainLink}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              复制主域名链接
            </button>
            
            {healthStatus?.error?.canRetry && (
              <button
                onClick={() => {
                  setShowFallback(false)
                  // Trigger health check retry
                  window.location.reload()
                }}
                className="w-full bg-green-100 text-green-700 py-3 px-4 rounded-lg hover:bg-green-200 transition-colors font-medium"
              >
                重新尝试子域名
              </button>
            )}
          </div>

          {showHealthStatus && healthStatus && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">连接状态：</p>
              <SubdomainHealthChecker
                subdomain={subdomain}
                host={host}
                onHealthStatusChange={handleHealthStatusChange}
                checkInterval={10000} // Check every 10 seconds in fallback mode
              />
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              如果问题持续存在，请联系网站管理员
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {showHealthStatus && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <SubdomainHealthChecker
            subdomain={subdomain}
            host={host}
            onHealthStatusChange={handleHealthStatusChange}
          />
        </div>
      )}
      {children}
    </div>
  )
}

export default SubdomainFallback