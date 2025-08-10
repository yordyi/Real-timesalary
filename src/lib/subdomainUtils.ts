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
    
    // 处理生产环境 - 支持多级域名
    const parts = host.split('.')
    
    // 检查是否为 real-timesalary.wanderhubt.com 或其子域名
    if (host.includes('wanderhubt.com')) {
      // 如果是 subdomain.real-timesalary.wanderhubt.com 格式
      if (parts.length >= 4 && parts[parts.length-3] === 'real-timesalary' && parts[parts.length-2] === 'wanderhubt') {
        return parts[0]
      }
      // 如果是 real-timesalary.wanderhubt.com (主域名)
      return null
    }
    
    // 其他域名的标准处理
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
    if (typeof window === 'undefined') return `https://${subdomain}.real-timesalary.wanderhubt.com${path}`
    
    const { protocol, host } = window.location
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
      return `${protocol}//${subdomain}.localhost${port}${path}`
    }
    
    // 生产环境 - 生成子域名URL
    if (host.includes('wanderhubt.com')) {
      return `${protocol}//${subdomain}.real-timesalary.wanderhubt.com${path}`
    }
    
    // 其他域名的标准处理
    const cleanHost = host.replace(/^[^.]+\./, '') // 移除现有子域名
    return `${protocol}//${subdomain}.${cleanHost}${path}`
  }

  static isSubdomainRoute(): boolean {
    return !!this.getCurrentSubdomain()
  }

  static getMainDomainUrl(path: string = ''): string {
    if (typeof window === 'undefined') return `https://real-timesalary.wanderhubt.com${path}`
    
    const { protocol, host } = window.location
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = host.includes(':') ? `:${host.split(':')[1]}` : ''
      return `${protocol}//localhost${port}${path}`
    }
    
    // 生产环境 - 返回主域名
    if (host.includes('wanderhubt.com')) {
      return `${protocol}//real-timesalary.wanderhubt.com${path}`
    }
    
    // 其他域名的标准处理
    const cleanHost = host.replace(/^[^.]+\./, '') // 移除子域名
    return `${protocol}//${cleanHost}${path}`
  }
}