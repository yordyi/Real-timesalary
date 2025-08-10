import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, protocol, host } = request.nextUrl
  
  // 获取子域名
  const subdomain = getSubdomain(host)
  
  if (subdomain) {
    // 如果是子域名访问，重定向到主域名但保持子域名信息
    const searchParams = new URLSearchParams()
    searchParams.set('subdomain', subdomain)
    
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = searchParams.toString()
    
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

function getSubdomain(host: string): string | null {
  if (!host) return null
  
  // 处理本地开发环境
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}