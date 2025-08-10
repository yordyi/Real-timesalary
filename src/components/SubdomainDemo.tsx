'use client'

import { useState, useEffect } from 'react'
import { SubdomainFallback } from './SubdomainFallback'
import { SubdomainHealthChecker } from './SubdomainHealthChecker'
import { UserService } from '@/lib/userService'
import { getSubdomainFromHost } from '@/lib/subdomainUtils'

interface SubdomainDemoProps {
  host: string
}

export const SubdomainDemo: React.FC<SubdomainDemoProps> = ({ host }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    // 检测当前子域名
    const currentSubdomain = getSubdomainFromHost(host)
    setSubdomain(currentSubdomain)
    
    if (currentSubdomain) {
      // 查找对应的用户
      const userData = UserService.getUserBySubdomain(currentSubdomain)
      setUser(userData)
      
      if (userData) {
        setShowDemo(true)
      }
    }
  }, [host])

  if (!subdomain || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            子域名TDD功能演示
          </h2>
          <p className="text-gray-600 mb-6">
            请访问一个有效的子域名来查看功能演示
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>示例: shuaihao.real-timesalary.wanderhubt.com</p>
            <p>或在本地: testuser.localhost:3000</p>
          </div>
        </div>
      </div>
    )
  }

  const handleFallbackActivated = (reason: string) => {
    console.log('Fallback activated:', reason)
  }

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            初始化子域名功能...
          </h2>
          <div className="animate-spin mx-auto w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">正在验证子域名配置</p>
        </div>
      </div>
    )
  }

  return (
    <SubdomainFallback
      subdomain={subdomain}
      host={host}
      onFallbackActivated={handleFallbackActivated}
      showHealthStatus={true}
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                🎉 子域名TDD功能成功运行！
              </h1>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">
                    ✅ 已实现的功能
                  </h3>
                  <ul className="space-y-2 text-green-700">
                    <li>• 子域名错误分类系统</li>
                    <li>• 实时健康检查机制</li>
                    <li>• 智能错误回退处理</li>
                    <li>• 自动重试策略</li>
                    <li>• 完整的测试覆盖</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    📊 用户信息
                  </h3>
                  <ul className="space-y-2 text-blue-700">
                    <li><strong>子域名:</strong> {subdomain}</li>
                    <li><strong>用户名:</strong> {user.username}</li>
                    <li><strong>用户ID:</strong> {user.id}</li>
                    <li><strong>创建时间:</strong> {new Date(user.createdAt).toLocaleString()}</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                  🔍 TDD测试覆盖范围
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-yellow-700">
                  <div>
                    <strong>错误分类测试:</strong>
                    <ul className="text-sm mt-1">
                      <li>• SSL证书错误</li>
                      <li>• DNS解析失败</li>
                      <li>• 连接超时</li>
                      <li>• 浏览器安全限制</li>
                      <li>• 服务器错误</li>
                      <li>• 网络连接错误</li>
                    </ul>
                  </div>
                  <div>
                    <strong>健康检查测试:</strong>
                    <ul className="text-sm mt-1">
                      <li>• 健康状态监控</li>
                      <li>• 自动重试机制</li>
                      <li>• 超时处理</li>
                      <li>• 周期性检查</li>
                      <li>• 手动重试功能</li>
                    </ul>
                  </div>
                  <div>
                    <strong>回退机制测试:</strong>
                    <ul className="text-sm mt-1">
                      <li>• 自动回退触发</li>
                      <li>• 主域名跳转</li>
                      <li>• 链接复制功能</li>
                      <li>• 健康状态恢复</li>
                      <li>• 渲染属性模式</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  通过TDD方法，我们成功构建了一个健壮的子域名错误处理系统！
                </p>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  TDD开发完成
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubdomainFallback>
  )
}

export default SubdomainDemo