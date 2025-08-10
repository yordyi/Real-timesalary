'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Crown, Link2, Copy, Check } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { SubdomainUtils } from '@/lib/subdomainUtils'
import { useLanguage } from '@/contexts/LanguageContext'

export function UserAuth() {
  const { user, createUser, setCurrentUser, isSubdomainRoute } = useUser()
  const { language } = useLanguage()
  const [showAuth, setShowAuth] = useState(!user && !isSubdomainRoute)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSubdomainUrl, setShowSubdomainUrl] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCreateUser = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    try {
      const newUser = createUser(username.trim(), email.trim() || undefined)
      setCurrentUser(newUser)
      setShowAuth(false)
      setShowSubdomainUrl(true)
    } catch (error) {
      console.error('创建用户失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copySubdomainUrl = () => {
    if (!user) return
    
    const url = SubdomainUtils.generateSubdomainUrl(user.subdomain)
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const texts = {
    zh: {
      title: '创建你的专属工资计算器',
      subtitle: '获得个人子域名，随时访问你的工资计算器',
      username: '用户名',
      email: '邮箱 (可选)',
      create: '创建我的计算器',
      creating: '创建中...',
      usernamePlaceholder: '请输入用户名',
      emailPlaceholder: '可选：your@email.com',
      success: '🎉 恭喜！你的专属链接已创建',
      yourLink: '你的专属链接',
      copy: '复制链接',
      copied: '已复制！',
      continue: '开始使用',
      welcome: '欢迎回来',
      yourDomain: '你的专属域名'
    },
    en: {
      title: 'Create Your Personal Salary Tracker',
      subtitle: 'Get your own subdomain to access your salary calculator anytime',
      username: 'Username',
      email: 'Email (Optional)',
      create: 'Create My Tracker',
      creating: 'Creating...',
      usernamePlaceholder: 'Enter your username',
      emailPlaceholder: 'Optional: your@email.com',
      success: '🎉 Congratulations! Your personal link is ready',
      yourLink: 'Your Personal Link',
      copy: 'Copy Link',
      copied: 'Copied!',
      continue: 'Start Using',
      welcome: 'Welcome Back',
      yourDomain: 'Your Personal Domain'
    }
  }

  const t = texts[language]

  if (user && !showSubdomainUrl && !isSubdomainRoute) {
    return (
      <div className="fixed top-20 right-6 z-40">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-yellow-200/50 max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-yellow-500" size={20} />
            <span className="text-amber-800 font-semibold">{t.welcome}</span>
          </div>
          <div className="text-sm text-amber-700 mb-3">
            {t.yourDomain}: <span className="font-mono font-bold text-amber-800">{user.subdomain}</span>
          </div>
          <button
            onClick={() => setShowSubdomainUrl(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
          >
            <Link2 size={16} />
            {t.yourLink}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  {t.title}
                </h2>
                <p className="text-amber-700 text-sm">
                  {t.subtitle}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-amber-700 font-medium mb-2">
                    {t.username}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white text-amber-800"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-amber-700 font-medium mb-2">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none bg-white text-amber-800"
                    disabled={isLoading}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  onClick={handleCreateUser}
                  disabled={!username.trim() || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t.creating : t.create}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubdomainUrl && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                  {t.success}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-green-700 font-medium mb-2">
                    {t.yourLink}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-800 font-mono text-sm break-all">
                      {SubdomainUtils.generateSubdomainUrl(user.subdomain)}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copySubdomainUrl}
                      className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                      {copiedUrl ? <Check size={20} /> : <Copy size={20} />}
                    </motion.button>
                  </div>
                  {copiedUrl && (
                    <p className="text-green-600 text-sm mt-1">{t.copied}</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSubdomainUrl(false)}
                  className="w-full py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t.continue}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}