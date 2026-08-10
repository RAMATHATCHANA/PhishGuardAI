import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard_title')}
        </h1>
        {user && (
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard_welcome')}, {user.name}!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => navigate('/upload')}
          className="card cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {t('quick_scan')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('scan_now')}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/modules')}
          className="card cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {t('nav_modules')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('modules_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/trends')}
          className="card cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {t('nav_trends')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('trends_subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {t('tagline')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          PhishGuard provides multi-surface phishing detection across text messages, emails, URLs, QR codes, and screenshots. Stay protected with our AI-powered analysis and real-time alerts.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">5+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Detection Methods</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">6</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">AI</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ML Powered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Protection</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
