'use client'

import { useEffect, useState, useCallback } from 'react'
import { SubdomainErrorClassifier, SubdomainErrorType, SubdomainError } from '@/utils/errorClassification'

export interface SubdomainHealthStatus {
  isHealthy: boolean
  error: SubdomainError | null
  lastChecked: Date
  attemptCount: number
  isChecking: boolean
}

interface SubdomainHealthCheckerProps {
  subdomain: string
  host: string
  onHealthStatusChange: (status: SubdomainHealthStatus) => void
  checkInterval?: number
  maxRetries?: number
  children?: (status: SubdomainHealthStatus & { retry?: () => Promise<void> }) => React.ReactNode
}

export const SubdomainHealthChecker: React.FC<SubdomainHealthCheckerProps> = ({
  subdomain,
  host,
  onHealthStatusChange,
  checkInterval = 30000, // 30 seconds
  maxRetries = 3,
  children
}) => {
  const [healthStatus, setHealthStatus] = useState<SubdomainHealthStatus>({
    isHealthy: true,
    error: null,
    lastChecked: new Date(),
    attemptCount: 0,
    isChecking: false
  })

  const checkSubdomainHealth = useCallback(async (attemptCount: number = 1): Promise<SubdomainHealthStatus> => {
    const startTime = Date.now()
    
    try {
      // Create subdomain URL
      const protocol = host.includes('localhost') ? 'http:' : 'https:'
      const subdomainUrl = `${protocol}//${subdomain}.${host}`
      
      setHealthStatus(prev => ({ ...prev, isChecking: true }))
      
      // Perform health check using fetch with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(subdomainUrl, {
        method: 'HEAD', // Use HEAD to minimize data transfer
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Avoid CORS issues
      })
      
      clearTimeout(timeoutId)
      
      const newStatus: SubdomainHealthStatus = {
        isHealthy: true,
        error: null,
        lastChecked: new Date(),
        attemptCount,
        isChecking: false
      }
      
      return newStatus
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const classifiedError = SubdomainErrorClassifier.classifyError(errorMessage)
      
      const newStatus: SubdomainHealthStatus = {
        isHealthy: false,
        error: classifiedError,
        lastChecked: new Date(),
        attemptCount,
        isChecking: false
      }
      
      // Determine if we should retry
      if (SubdomainErrorClassifier.shouldRetry(classifiedError.type, attemptCount) && attemptCount < maxRetries) {
        const retryDelay = SubdomainErrorClassifier.getRetryDelay(classifiedError.type, attemptCount)
        
        if (retryDelay > 0) {
          // Schedule retry
          setTimeout(async () => {
            const retryStatus = await checkSubdomainHealth(attemptCount + 1)
            setHealthStatus(retryStatus)
            onHealthStatusChange(retryStatus)
          }, retryDelay)
        }
      }
      
      return newStatus
    }
  }, [subdomain, host, maxRetries, onHealthStatusChange])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    
    const performHealthCheck = async () => {
      const status = await checkSubdomainHealth(1)
      setHealthStatus(status)
      onHealthStatusChange(status)
    }
    
    // Initial health check
    performHealthCheck()
    
    // Set up periodic health checks
    if (checkInterval > 0) {
      intervalId = setInterval(performHealthCheck, checkInterval)
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [checkSubdomainHealth, checkInterval, onHealthStatusChange])

  // Manual retry function
  const retryHealthCheck = useCallback(async () => {
    const status = await checkSubdomainHealth(1)
    setHealthStatus(status)
    onHealthStatusChange(status)
  }, [checkSubdomainHealth, onHealthStatusChange])

  if (children) {
    return <>{children({ ...healthStatus, retry: retryHealthCheck })}</>
  }

  return (
    <div className="subdomain-health-checker">
      {healthStatus.isChecking ? (
        <div className="flex items-center gap-2 text-yellow-600">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
          <span>检查子域名状态...</span>
        </div>
      ) : healthStatus.isHealthy ? (
        <div className="flex items-center gap-2 text-green-600">
          <div className="h-2 w-2 bg-green-600 rounded-full" />
          <span>子域名正常</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-600">
            <div className="h-2 w-2 bg-red-600 rounded-full" />
            <span>子域名异常</span>
          </div>
          {healthStatus.error && (
            <div className="text-sm text-gray-600">
              <p>{healthStatus.error.userMessage}</p>
              <p className="text-xs mt-1">{healthStatus.error.suggestedAction}</p>
              {healthStatus.error.canRetry && (
                <button
                  onClick={retryHealthCheck}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                >
                  重试
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SubdomainHealthChecker