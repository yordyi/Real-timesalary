'use client'

import { useState } from 'react'
import { UserService } from '@/lib/userService'
import { SubdomainUtils } from '@/lib/subdomainUtils'

export function AdminPanel() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')

  const createTestUser = () => {
    if (!username) return
    
    try {
      const user = UserService.createUser(username)
      setMessage(`用户创建成功！子域名: ${user.subdomain}`)
      
      // 生成链接
      const url = SubdomainUtils.generateSubdomainUrl(user.subdomain)
      console.log('生成的链接:', url)
      
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('创建用户失败')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const deleteAllUsers = () => {
    localStorage.removeItem('salary_tracker_users')
    localStorage.removeItem('current_user_id')
    setMessage('所有用户数据已删除')
    setTimeout(() => setMessage(''), 3000)
  }

  // 只在开发环境显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setShowAdmin(!showAdmin)}
        className="fixed top-4 left-4 bg-red-500 text-white p-2 rounded z-50 text-xs"
      >
        🔧
      </button>

      {showAdmin && (
        <div className="fixed top-16 left-4 bg-white border shadow-lg rounded-lg p-4 z-50 min-w-[300px]">
          <h3 className="font-bold mb-4">管理面板</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">创建测试用户</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={createTestUser}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  创建
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={() => {
                  setUsername('shuaihao')
                  setTimeout(createTestUser, 100)
                }}
                className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm mb-2"
              >
                快速创建 &quot;shuaihao&quot; 用户
              </button>
            </div>

            <div>
              <button
                onClick={deleteAllUsers}
                className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm"
              >
                清除所有用户数据
              </button>
            </div>

            {message && (
              <div className="p-2 bg-green-100 text-green-800 rounded text-sm">
                {message}
              </div>
            )}

            <div className="text-xs text-gray-500">
              <div>当前用户数量: {UserService.getAllUsers().length}</div>
              <div>用户列表:</div>
              {UserService.getAllUsers().map(user => (
                <div key={user.id} className="ml-2">
                  {user.subdomain} → {user.username}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}