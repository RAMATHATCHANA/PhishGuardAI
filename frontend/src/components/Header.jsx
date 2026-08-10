import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logo from '../assets/phishguard-logo.png'

const Header = ({ theme, toggleTheme, currentLanguage, changeLanguage }) => {
  const { t } = useTranslation()
  const location = useLocation()

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'hi', name: 'हिंदी' }
  ]

  const navItems = [
    { path: '/dashboard', key: 'nav_dashboard' },
    { path: '/upload', key: 'nav_upload' },
    { path: '/modules', key: 'nav_modules' },
    { path: '/trends', key: 'nav_trends' },
    { path: '/profile', key: 'nav_profile' }
  ]

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="PhishGuard Logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold text-primary-600">{t('app_name')}</span>
          </div>

          <nav className="hidden md:flex space-x-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
