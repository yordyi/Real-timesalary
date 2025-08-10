'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Clock, Calendar, Settings } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@/contexts/UserContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { UserAuth } from '@/components/UserAuth'

interface CoinProps {
  id: number;
}

function Coin({ id }: CoinProps) {
  return (
    <motion.div
      key={id}
      initial={{ 
        y: -100, 
        x: Math.random() * 300 - 150,
        opacity: 1,
        rotateZ: 0
      }}
      animate={{ 
        y: typeof window !== 'undefined' ? window.innerHeight + 100 : 800,
        opacity: 0,
        rotateZ: 720
      }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 3,
        ease: "easeIn"
      }}
      className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none z-40"
    >
      <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-full shadow-lg border-2 border-yellow-200 flex items-center justify-center">
        <span className="text-yellow-800 text-xs font-bold">¥</span>
      </div>
    </motion.div>
  )
}

export default function SalaryTracker() {
  const { language, t } = useLanguage()
  const { user, updateSalaryConfig, isSubdomainRoute } = useUser()
  const [monthlySalary, setMonthlySalary] = useState<number>(user?.salaryConfig.monthlySalary || (language === 'en' ? 5000 : 10000))
  const [workStartTime, setWorkStartTime] = useState<string>(user?.salaryConfig.workStartTime || '09:00')
  const [workEndTime, setWorkEndTime] = useState<string>(user?.salaryConfig.workEndTime || '18:00')
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState<number>(user?.salaryConfig.workDaysPerMonth || 22)
  const [currentEarnings, setCurrentEarnings] = useState<number>(0)
  const [coins, setCoins] = useState<number[]>([])
  const [isWorking, setIsWorking] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(true)
  const [demoMode, setDemoMode] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      setMonthlySalary(user.salaryConfig.monthlySalary)
      setWorkStartTime(user.salaryConfig.workStartTime)
      setWorkEndTime(user.salaryConfig.workEndTime)
      setWorkDaysPerMonth(user.salaryConfig.workDaysPerMonth)
    } else if (!isSubdomainRoute) {
      setMonthlySalary(language === 'en' ? 5000 : 10000)
    }
  }, [user, language, isSubdomainRoute])

  const handleConfigChange = (key: string, value: number | string) => {
    if (user && updateSalaryConfig) {
      updateSalaryConfig({ [key]: value })
    }
  }

  useEffect(() => {
    const checkWorkingStatus = () => {
      if (demoMode) return true
      
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const startTime = parseInt(workStartTime.split(':')[0]) * 60 + parseInt(workStartTime.split(':')[1])
      const endTime = parseInt(workEndTime.split(':')[0]) * 60 + parseInt(workEndTime.split(':')[1])
      
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5
      const isWorkingHours = currentTime >= startTime && currentTime <= endTime
      
      return isWeekday && isWorkingHours
    }

    const calculateEarnings = () => {
      if (!isWorking) return

      const hoursPerDay = (parseInt(workEndTime.split(':')[0]) * 60 + parseInt(workEndTime.split(':')[1]) - 
                          parseInt(workStartTime.split(':')[0]) * 60 - parseInt(workStartTime.split(':')[1])) / 60
      const earningsPerSecond = monthlySalary / (workDaysPerMonth * hoursPerDay * 3600)
      
      setCurrentEarnings(prev => {
        const newEarnings = prev + earningsPerSecond
        
        const threshold = language === 'en' ? 5 : 10
        if (Math.floor(newEarnings) % threshold === 0 && Math.floor(newEarnings) !== Math.floor(prev)) {
          const newCoinId = Date.now() + Math.random()
          setCoins(prevCoins => [...prevCoins, newCoinId])
          
          setTimeout(() => {
            setCoins(prevCoins => prevCoins.filter(id => id !== newCoinId))
          }, 3000)
        }
        
        return newEarnings
      })
    }

    setIsWorking(checkWorkingStatus())
    const interval = setInterval(() => {
      setIsWorking(checkWorkingStatus())
      calculateEarnings()
    }, 1000)

    return () => clearInterval(interval)
  }, [monthlySalary, workStartTime, workEndTime, workDaysPerMonth, isWorking, language, demoMode])

  const formatCurrency = (amount: number) => {
    if (language === 'en') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } else {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-orange-400/10" />
      
      <LanguageSwitcher />
      <UserAuth />
      
      <AnimatePresence>
        {coins.map(coinId => (
          <Coin key={coinId} id={coinId} />
        ))}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
            {t.title}
          </h1>
          <p className="text-amber-700 text-lg">
            {isWorking ? t.subtitle.working : t.subtitle.notWorking}
          </p>
          <div className="mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDemoMode(!demoMode)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                demoMode 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg' 
                  : 'bg-white/70 text-amber-700 border border-amber-200 hover:bg-white/90'
              }`}
            >
              {demoMode ? '🟢 演示模式开启' : '⚪ 点击开启演示'}
            </motion.button>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-yellow-200/50 mb-8"
          >
            <div className="text-center">
              <motion.div
                key={Math.floor(currentEarnings * 100)}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.3 }}
                className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4"
              >
                {formatCurrency(currentEarnings)}
              </motion.div>
              <div className="text-amber-600 text-xl mb-4">{t.earnings.today}</div>
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <div className={`w-3 h-3 rounded-full ${isWorking ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span>{isWorking ? t.status.working : t.status.resting}</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-yellow-200/50"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="text-amber-600" size={24} />
                  <h2 className="text-2xl font-bold text-amber-800">{t.settings.title}</h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-amber-700 font-medium">
                      <DollarSign size={18} />
                      {t.settings.monthlySalary}
                    </label>
                    <input
                      type="number"
                      value={monthlySalary}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setMonthlySalary(value)
                        handleConfigChange('monthlySalary', value)
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white/70 text-amber-800 font-medium"
                      placeholder={t.settings.placeholders.salary}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-amber-700 font-medium">
                      <Clock size={18} />
                      {t.settings.workStartTime}
                    </label>
                    <input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => {
                        setWorkStartTime(e.target.value)
                        handleConfigChange('workStartTime', e.target.value)
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white/70 text-amber-800 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-amber-700 font-medium">
                      <Clock size={18} />
                      {t.settings.workEndTime}
                    </label>
                    <input
                      type="time"
                      value={workEndTime}
                      onChange={(e) => {
                        setWorkEndTime(e.target.value)
                        handleConfigChange('workEndTime', e.target.value)
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white/70 text-amber-800 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-amber-700 font-medium">
                      <Calendar size={18} />
                      {t.settings.workDaysPerMonth}
                    </label>
                    <input
                      type="number"
                      value={workDaysPerMonth}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setWorkDaysPerMonth(value)
                        handleConfigChange('workDaysPerMonth', value)
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white/70 text-amber-800 font-medium"
                      placeholder={t.settings.placeholders.workDays}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {t.settings.hideSettings}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showSettings && (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                {t.settings.showSettings}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-yellow-100/80 to-transparent pointer-events-none" />
    </div>
  )
}