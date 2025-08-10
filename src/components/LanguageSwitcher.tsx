'use client'

import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Language } from '@/lib/translations'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  return (
    <div className="fixed top-6 right-6 z-50">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-yellow-200/50"
      >
        <div className="flex items-center gap-3">
          <Globe className="text-amber-600" size={20} />
          <div className="flex bg-yellow-50 rounded-xl p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLanguageChange('zh')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                language === 'zh'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md'
                  : 'text-amber-700 hover:bg-yellow-100'
              }`}
            >
              中文
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                language === 'en'
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md'
                  : 'text-amber-700 hover:bg-yellow-100'
              }`}
            >
              EN
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}