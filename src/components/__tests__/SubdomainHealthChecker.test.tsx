import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubdomainHealthChecker } from '../SubdomainHealthChecker'
import { SubdomainErrorType } from '@/utils/errorClassification'

// Mock fetch
global.fetch = jest.fn()
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock setTimeout and clearTimeout
jest.useFakeTimers()

describe('SubdomainHealthChecker', () => {
  const defaultProps = {
    subdomain: 'test',
    host: 'example.com',
    onHealthStatusChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  it('should render loading state initially', () => {
    mockedFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    expect(screen.getByText('检查子域名状态...')).toBeInTheDocument()
  })

  it('should show healthy status when subdomain is accessible', async () => {
    mockedFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名正常')).toBeInTheDocument()
    })
    
    expect(defaultProps.onHealthStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isHealthy: true,
        error: null
      })
    )
  })

  it('should show error status when subdomain is not accessible', async () => {
    const networkError = new Error('Network error')
    mockedFetch.mockRejectedValueOnce(networkError)
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名异常')).toBeInTheDocument()
    })
    
    expect(screen.getByText('网络连接错误')).toBeInTheDocument()
    expect(screen.getByText('请检查网络连接')).toBeInTheDocument()
    
    expect(defaultProps.onHealthStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isHealthy: false,
        error: expect.objectContaining({
          type: SubdomainErrorType.NETWORK_ERROR
        })
      })
    )
  })

  it('should show retry button for retryable errors', async () => {
    const networkError = new Error('Network error')
    mockedFetch.mockRejectedValueOnce(networkError)
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument()
    })
  })

  it('should not show retry button for non-retryable errors', async () => {
    const sslError = new Error('SSL certificate error')
    mockedFetch.mockRejectedValueOnce(sslError)
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名异常')).toBeInTheDocument()
    })
    
    expect(screen.queryByText('重试')).not.toBeInTheDocument()
  })

  it('should handle manual retry', async () => {
    const user = userEvent.setup({ delay: null })
    
    // First call fails
    const networkError = new Error('Network error')
    mockedFetch.mockRejectedValueOnce(networkError)
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeInTheDocument()
    })
    
    // Second call succeeds
    mockedFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    
    await user.click(screen.getByText('重试'))
    
    await waitFor(() => {
      expect(screen.getByText('子域名正常')).toBeInTheDocument()
    })
  })

  it('should use HTTP for localhost and HTTPS for other hosts', async () => {
    const localhostProps = { ...defaultProps, host: 'localhost:3000' }
    
    mockedFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    
    render(<SubdomainHealthChecker {...localhostProps} />)
    
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(
        'http://test.localhost:3000',
        expect.any(Object)
      )
    })
    
    // Test HTTPS for production
    jest.clearAllMocks()
    const productionProps = { ...defaultProps, host: 'example.com' }
    
    mockedFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    
    render(<SubdomainHealthChecker {...productionProps} />)
    
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.example.com',
        expect.any(Object)
      )
    })
  })

  it('should handle timeout errors', async () => {
    // Mock fetch to hang and then get aborted
    const abortError = new Error('The operation was aborted') as Error & { name: string }
    abortError.name = 'AbortError'
    
    mockedFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(abortError), 12000) // Longer than timeout
      })
    })
    
    render(<SubdomainHealthChecker {...defaultProps} />)
    
    // Fast-forward time to trigger timeout
    jest.advanceTimersByTime(11000)
    
    await waitFor(() => {
      expect(screen.getByText('子域名异常')).toBeInTheDocument()
    })
  })

  it('should perform periodic health checks', async () => {
    mockedFetch.mockResolvedValue(new Response('', { status: 200 }))
    
    render(
      <SubdomainHealthChecker 
        {...defaultProps} 
        checkInterval={5000} 
      />
    )
    
    // Initial call
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(1)
    })
    
    // Fast forward time to trigger periodic check
    jest.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('should support render prop pattern', async () => {
    mockedFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    
    const renderProp = jest.fn(({ isHealthy }) => (
      <div>{isHealthy ? 'Custom Healthy' : 'Custom Error'}</div>
    ))
    
    render(
      <SubdomainHealthChecker {...defaultProps}>
        {renderProp}
      </SubdomainHealthChecker>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Custom Healthy')).toBeInTheDocument()
    })
    
    expect(renderProp).toHaveBeenCalledWith(
      expect.objectContaining({
        isHealthy: true,
        retry: expect.any(Function)
      })
    )
  })

  it('should handle automatic retries for retryable errors', async () => {
    // First call fails with retryable error
    const networkError = new Error('Network error')
    mockedFetch
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(new Response('', { status: 200 }))
    
    render(<SubdomainHealthChecker {...defaultProps} maxRetries={2} />)
    
    await waitFor(() => {
      expect(screen.getByText('子域名异常')).toBeInTheDocument()
    })
    
    // Fast forward to trigger retry
    jest.advanceTimersByTime(3000) // DNS error retry delay + jitter
    
    await waitFor(() => {
      expect(screen.getByText('子域名正常')).toBeInTheDocument()
    }, { timeout: 5000 })
    
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })
})