import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { SubdomainFallback } from '../SubdomainFallback'
import { SubdomainErrorType } from '@/utils/errorClassification'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock SubdomainHealthChecker
jest.mock('../SubdomainHealthChecker', () => ({
  SubdomainHealthChecker: ({ onHealthStatusChange, children }: any) => {
    // Simulate health check trigger
    React.useEffect(() => {
      // Mock health status change
      if (typeof onHealthStatusChange === 'function') {
        setTimeout(() => {
          onHealthStatusChange({
            isHealthy: false,
            error: {
              type: SubdomainErrorType.SSL_CERTIFICATE,
              userMessage: 'SSL证书配置有问题',
              canRetry: false,
              fallbackAvailable: true
            },
            attemptCount: 1,
            lastChecked: new Date(),
            isChecking: false
          })
        }, 100)
      }
    }, [onHealthStatusChange])
    
    if (children) {
      return children({ isHealthy: false, error: null })
    }
    
    return <div data-testid="health-checker">Health Checker</div>
  }
}))

// Mock alert
global.alert = jest.fn()

const mockPush = jest.fn()

describe('SubdomainFallback', () => {
  const defaultProps = {
    subdomain: 'testuser',
    host: 'example.com',
    children: <div>App Content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    
    // Reset window.location search
    global.window.location.search = '?test=value'
  })

  it('should render children normally when subdomain is healthy', () => {
    // Mock healthy status
    jest.doMock('../SubdomainHealthChecker', () => ({
      SubdomainHealthChecker: ({ onHealthStatusChange, children }: any) => {
        React.useEffect(() => {
          if (typeof onHealthStatusChange === 'function') {
            setTimeout(() => {
              onHealthStatusChange({
                isHealthy: true,
                error: null,
                attemptCount: 1,
                lastChecked: new Date(),
                isChecking: false
              })
            }, 100)
          }
        }, [onHealthStatusChange])
        
        if (children) {
          return children({ isHealthy: true, error: null })
        }
        
        return <div data-testid="health-checker">Health Checker</div>
      }
    }))

    render(<SubdomainFallback {...defaultProps} />)
    
    expect(screen.getByText('App Content')).toBeInTheDocument()
    expect(screen.queryByText('子域名访问异常')).not.toBeInTheDocument()
  })

  it('should show fallback immediately for non-retryable errors', async () => {
    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名访问异常')).toBeInTheDocument()
    })
    
    expect(screen.getByText('SSL证书配置有问题')).toBeInTheDocument()
    expect(screen.getByText('使用主域名访问')).toBeInTheDocument()
    expect(screen.getByText('复制主域名链接')).toBeInTheDocument()
  })

  it('should handle main domain redirection', async () => {
    const user = userEvent.setup()
    
    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('使用主域名访问')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('使用主域名访问'))
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('https://example.com?user=testuser&test=value')
    )
  })

  it('should handle localhost redirection correctly', async () => {
    const user = userEvent.setup()
    const localhostProps = { ...defaultProps, host: 'localhost:3000' }
    
    render(<SubdomainFallback {...localhostProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('使用主域名访问')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('使用主域名访问'))
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:3000?user=testuser&test=value')
    )
  })

  it('should copy main domain link to clipboard', async () => {
    const user = userEvent.setup()
    
    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('复制主域名链接')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('复制主域名链接'))
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com?user=testuser'
    )
    expect(global.alert).toHaveBeenCalledWith('主域名链接已复制到剪贴板')
  })

  it('should show retry button for retryable errors', async () => {
    // Mock retryable error
    jest.doMock('../SubdomainHealthChecker', () => ({
      SubdomainHealthChecker: ({ onHealthStatusChange, children }: any) => {
        React.useEffect(() => {
          if (typeof onHealthStatusChange === 'function') {
            setTimeout(() => {
              onHealthStatusChange({
                isHealthy: false,
                error: {
                  type: SubdomainErrorType.NETWORK_ERROR,
                  userMessage: '网络连接错误',
                  canRetry: true,
                  fallbackAvailable: true
                },
                attemptCount: 3, // Multiple attempts to trigger fallback
                lastChecked: new Date(),
                isChecking: false
              })
            }, 100)
          }
        }, [onHealthStatusChange])
        
        if (children) {
          return children({ isHealthy: false, error: { canRetry: true } })
        }
        
        return <div data-testid="health-checker">Health Checker</div>
      }
    }))

    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('重新尝试子域名')).toBeInTheDocument()
    })
  })

  it('should handle retry action', async () => {
    const user = userEvent.setup()
    
    // Mock retryable error first
    jest.doMock('../SubdomainHealthChecker', () => ({
      SubdomainHealthChecker: ({ onHealthStatusChange, children }: any) => {
        React.useEffect(() => {
          if (typeof onHealthStatusChange === 'function') {
            setTimeout(() => {
              onHealthStatusChange({
                isHealthy: false,
                error: {
                  type: SubdomainErrorType.NETWORK_ERROR,
                  userMessage: '网络连接错误',
                  canRetry: true,
                  fallbackAvailable: true
                },
                attemptCount: 3,
                lastChecked: new Date(),
                isChecking: false
              })
            }, 100)
          }
        }, [onHealthStatusChange])
        
        if (children) {
          return children({ isHealthy: false, error: { canRetry: true } })
        }
        
        return <div data-testid="health-checker">Health Checker</div>
      }
    }))

    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('重新尝试子域名')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('重新尝试子域名'))
    
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('should call onFallbackActivated callback', async () => {
    const onFallbackActivated = jest.fn()
    
    render(
      <SubdomainFallback 
        {...defaultProps} 
        onFallbackActivated={onFallbackActivated}
      />
    )
    
    await waitFor(() => {
      expect(onFallbackActivated).toHaveBeenCalledWith('SSL证书配置有问题')
    })
  })

  it('should hide health status when showHealthStatus is false', async () => {
    render(
      <SubdomainFallback 
        {...defaultProps} 
        showHealthStatus={false}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('子域名访问异常')).toBeInTheDocument()
    })
    
    expect(screen.queryByTestId('health-checker')).not.toBeInTheDocument()
  })

  it('should handle clipboard copy failure gracefully', async () => {
    const user = userEvent.setup()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // Mock clipboard failure
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard failed'))
    
    render(<SubdomainFallback {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('复制主域名链接')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('复制主域名链接'))
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy link:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('should restore normal view when health is recovered', async () => {
    // Start with unhealthy status, then recover
    let healthStatus = {
      isHealthy: false,
      error: {
        type: SubdomainErrorType.SSL_CERTIFICATE,
        userMessage: 'SSL证书配置有问题',
        canRetry: false,
        fallbackAvailable: true
      },
      attemptCount: 1,
      lastChecked: new Date(),
      isChecking: false
    }

    const TestComponent = () => {
      const [status, setStatus] = React.useState(healthStatus)
      
      React.useEffect(() => {
        setTimeout(() => {
          setStatus({
            isHealthy: true,
            error: null,
            attemptCount: 1,
            lastChecked: new Date(),
            isChecking: false
          })
        }, 1000)
      }, [])
      
      return (
        <SubdomainFallback
          {...defaultProps}
          showHealthStatus={false} // Avoid double health checker
        >
          <div>App Content</div>
        </SubdomainFallback>
      )
    }

    render(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名访问异常')).toBeInTheDocument()
    })
    
    // Wait for recovery
    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeInTheDocument()
    }, { timeout: 2000 })
    
    expect(screen.queryByText('子域名访问异常')).not.toBeInTheDocument()
  })
})