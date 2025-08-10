'use client'

import { User, SalaryConfig } from './types'

const STORAGE_KEY = 'salary_tracker_users'
const CURRENT_USER_KEY = 'current_user_id'

export class UserService {
  static getAllUsers(): User[] {
    if (typeof window === 'undefined') return []
    
    try {
      const users = localStorage.getItem(STORAGE_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  static saveUser(user: User): void {
    if (typeof window === 'undefined') return
    
    const users = this.getAllUsers()
    const existingIndex = users.findIndex(u => u.id === user.id)
    
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  }

  static getUserById(id: string): User | null {
    const users = this.getAllUsers()
    return users.find(u => u.id === id) || null
  }

  static getUserBySubdomain(subdomain: string): User | null {
    const users = this.getAllUsers()
    return users.find(u => u.subdomain === subdomain) || null
  }

  static isSubdomainTaken(subdomain: string): boolean {
    return this.getUserBySubdomain(subdomain) !== null
  }

  static generateSubdomain(username: string): string {
    let baseSubdomain = username.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 16)
    
    if (!baseSubdomain) {
      baseSubdomain = 'user'
    }

    let subdomain = baseSubdomain
    let counter = 1
    
    while (this.isSubdomainTaken(subdomain)) {
      subdomain = `${baseSubdomain}${counter}`
      counter++
    }
    
    return subdomain
  }

  static createUser(username: string, email?: string): User {
    const subdomain = this.generateSubdomain(username)
    const user: User = {
      id: crypto.randomUUID(),
      username,
      subdomain,
      email,
      createdAt: new Date(),
      salaryConfig: {
        monthlySalary: 10000,
        workStartTime: '09:00',
        workEndTime: '18:00',
        workDaysPerMonth: 22,
        currency: 'CNY',
        language: 'zh'
      }
    }
    
    this.saveUser(user)
    return user
  }

  static getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(CURRENT_USER_KEY)
  }

  static setCurrentUser(userId: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(CURRENT_USER_KEY, userId)
  }

  static updateUserConfig(userId: string, config: Partial<SalaryConfig>): void {
    const user = this.getUserById(userId)
    if (user) {
      user.salaryConfig = { ...user.salaryConfig, ...config }
      this.saveUser(user)
    }
  }

  static validateSubdomain(subdomain: string): boolean {
    return /^[a-z0-9]{1,16}$/.test(subdomain)
  }
}