'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, SalaryConfig } from '@/lib/types'
import { UserService } from '@/lib/userService'
import { SubdomainUtils } from '@/lib/subdomainUtils'

interface UserContextType {
  user: User | null
  isSubdomainRoute: boolean
  subdomainInfo: any
  updateSalaryConfig: (config: Partial<SalaryConfig>) => void
  createUser: (username: string, email?: string) => User
  setCurrentUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isSubdomainRoute, setIsSubdomainRoute] = useState(false)
  const [subdomainInfo, setSubdomainInfo] = useState<any>(null)

  useEffect(() => {
    // 检查是否是子域名路由
    const subdomain = SubdomainUtils.getCurrentSubdomain()
    const isSubdomain = !!subdomain
    setIsSubdomainRoute(isSubdomain)

    if (isSubdomain) {
      // 子域名路由：根据子域名加载用户
      const info = SubdomainUtils.getSubdomainInfo()
      setSubdomainInfo(info)
      
      if (info?.isValid && info.userId) {
        const subdomainUser = UserService.getUserById(info.userId)
        setUser(subdomainUser)
        UserService.setCurrentUser(info.userId)
      }
    } else {
      // 主域名路由：加载当前用户
      const currentUserId = UserService.getCurrentUserId()
      if (currentUserId) {
        const currentUser = UserService.getUserById(currentUserId)
        setUser(currentUser)
      }
    }
  }, [])

  const updateSalaryConfig = (config: Partial<SalaryConfig>) => {
    if (!user) return
    
    UserService.updateUserConfig(user.id, config)
    const updatedUser = UserService.getUserById(user.id)
    setUser(updatedUser)
  }

  const createUser = (username: string, email?: string): User => {
    const newUser = UserService.createUser(username, email)
    return newUser
  }

  const setCurrentUser = (newUser: User) => {
    setUser(newUser)
    UserService.setCurrentUser(newUser.id)
  }

  const value: UserContextType = {
    user,
    isSubdomainRoute,
    subdomainInfo,
    updateSalaryConfig,
    createUser,
    setCurrentUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}