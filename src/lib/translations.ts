export type Language = 'zh' | 'en'

export interface Translations {
  title: string
  description: string
  subtitle: {
    working: string
    notWorking: string
  }
  earnings: {
    today: string
    currency: string
  }
  status: {
    working: string
    resting: string
  }
  settings: {
    title: string
    monthlySalary: string
    workStartTime: string
    workEndTime: string
    workDaysPerMonth: string
    hideSettings: string
    showSettings: string
    placeholders: {
      salary: string
      workDays: string
    }
  }
  language: {
    switch: string
    chinese: string
    english: string
  }
  demo: {
    enable: string
    enabled: string
  }
}

export const translations: Record<Language, Translations> = {
  zh: {
    title: '实时工资计算器',
    description: '实时追踪你的收入',
    subtitle: {
      working: '正在赚钱中...',
      notWorking: '暂时不在工作时间'
    },
    earnings: {
      today: '今日已赚取',
      currency: 'CNY'
    },
    status: {
      working: '工作中',
      resting: '休息中'
    },
    settings: {
      title: '工资设置',
      monthlySalary: '月薪 (元)',
      workStartTime: '上班时间',
      workEndTime: '下班时间',
      workDaysPerMonth: '月工作天数',
      hideSettings: '收起设置',
      showSettings: '显示设置',
      placeholders: {
        salary: '10000',
        workDays: '22'
      }
    },
    language: {
      switch: '切换语言',
      chinese: '中文',
      english: 'English'
    },
    demo: {
      enable: '⚪ 点击开启演示',
      enabled: '🟢 演示模式开启'
    }
  },
  en: {
    title: 'Real-time Salary Tracker',
    description: 'Track your income in real-time',
    subtitle: {
      working: 'Making money...',
      notWorking: 'Currently not in working hours'
    },
    earnings: {
      today: 'Today\'s Earnings',
      currency: 'USD'
    },
    status: {
      working: 'Working',
      resting: 'Resting'
    },
    settings: {
      title: 'Salary Settings',
      monthlySalary: 'Monthly Salary ($)',
      workStartTime: 'Work Start Time',
      workEndTime: 'Work End Time',
      workDaysPerMonth: 'Work Days per Month',
      hideSettings: 'Hide Settings',
      showSettings: 'Show Settings',
      placeholders: {
        salary: '5000',
        workDays: '22'
      }
    },
    language: {
      switch: 'Switch Language',
      chinese: '中文',
      english: 'English'
    },
    demo: {
      enable: '⚪ Enable Demo Mode',
      enabled: '🟢 Demo Mode Active'
    }
  }
}