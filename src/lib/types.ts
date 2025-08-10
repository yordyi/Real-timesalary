export interface User {
  id: string
  username: string
  subdomain: string
  email?: string
  createdAt: Date
  salaryConfig: SalaryConfig
}

export interface SalaryConfig {
  monthlySalary: number
  workStartTime: string
  workEndTime: string
  workDaysPerMonth: number
  currency: 'CNY' | 'USD'
  language: 'zh' | 'en'
}

export interface SubdomainInfo {
  subdomain: string
  userId: string
  isValid: boolean
}