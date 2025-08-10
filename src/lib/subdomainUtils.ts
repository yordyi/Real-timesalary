'use client'

import { SubdomainInfo } from './types'
import { UserService } from './userService'

export class SubdomainUtils {
  static getSubdomainFromHost(host: string): string | null {
    if (!host) return null
    
    // 处理本地开发环境
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // 格式: subdomain.localhost:3001 或 subdomain.127.0.0.1:3001
      const parts = host.split('.')
      if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== '127') {
        return parts[0].split(':')[0] // 移除端口号
      }
      return null
    }
    
    // 处理生产环境
    const parts = host.split('.')
    if (parts.length >= 3) {
      return parts[0]
    }
    
    return null
  }

  static getCurrentSubdomain(): string | null {
    if (typeof window === 'undefined') return null
    return this.getSubdomainFromHost(window.location.host)
  }

  static getSubdomainInfo(): SubdomainInfo | null {
    const subdomain = this.getCurrentSubdomain()
    if (!subdomain) return null
    
    const user = UserService.getUserBySubdomain(subdomain)
    return {
      subdomain,
      userId: user?.id || '',
      isValid: !!user
    }
  }

  static generateSubdomainUrl(subdomain: string, path: string = ''): string {
    if (typeof window === 'undefined') return `https://${subdomain}.example.com${path}`
    
    const { protocol, host } = window.location
    const cleanHost = host.replace(/^[^.]+\./, '') // 移除现有子域名
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
      return `${protocol}//${subdomain}.localhost${port}${path}`
    }
    
    return `${protocol}//${subdomain}.${cleanHost}${path}`
  }

  static isSubdomainRoute(): boolean {
    return !!this.getCurrentSubdomain()
  }

  static getMainDomainUrl(path: string = ''): string {
    if (typeof window === 'undefined') return `https://example.com${path}`
    
    const { protocol, host } = window.location
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
      return `${protocol}//localhost${port}${path}`
    }
    
    const cleanHost = host.replace(/^[^.]+\./, '') // 移除子域名
    return `${protocol}//${cleanHost}${path}`
  }
}