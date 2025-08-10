'use client'

import { useEffect, useState } from 'react'
import { SubdomainUtils } from '@/lib/subdomainUtils'
import { UserService } from '@/lib/userService'
import { User, SubdomainInfo } from '@/lib/types'

interface DebugInfo {
  host: string
  subdomain: string | null
  subdomainInfo: SubdomainInfo | null
  user: User | null
  allUsers: User[]
  isSubdomainRoute: boolean
}

export function SubdomainDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host
      const subdomain = SubdomainUtils.getCurrentSubdomain()
      const subdomainInfo = SubdomainUtils.getSubdomainInfo()
      const user = subdomain ? UserService.getUserBySubdomain(subdomain) : null
      const allUsers = UserService.getAllUsers()

      setDebugInfo({
        host,
        subdomain,
        subdomainInfo,
        user,
        allUsers,
        isSubdomainRoute: SubdomainUtils.isSubdomainRoute()
      })
    }
  }, [])

  if (!debugInfo || process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <div className="font-bold mb-2">🐛 Subdomain Debug Info</div>
      <div><strong>Host:</strong> {debugInfo.host}</div>
      <div><strong>Subdomain:</strong> {debugInfo.subdomain || 'null'}</div>
      <div><strong>Is Subdomain Route:</strong> {debugInfo.isSubdomainRoute ? 'true' : 'false'}</div>
      <div><strong>User Found:</strong> {debugInfo.user ? debugInfo.user.username : 'null'}</div>
      <div><strong>Total Users:</strong> {debugInfo.allUsers.length}</div>
      {debugInfo.allUsers.length > 0 && (
        <div>
          <strong>All Users:</strong>
          <div className="ml-2">
            {debugInfo.allUsers.map((user: User) => (
              <div key={user.id}>{user.subdomain} → {user.username}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}