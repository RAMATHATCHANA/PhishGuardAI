import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import logo from '../assets/phishguard-logo.png'

// Use relative URLs - Vite proxy will forward to backend
const API_URL = ''

const Login = ({ onLogin }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: 'Male',
    age_group: '15-40',
    designation: 'student'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })

      await axios.post(`${API_URL}/users/register`, formDataToSend)
      
      localStorage.setItem('user', JSON.stringify(formData))
      onLogin()
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="PhishGuard Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('login_title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('name')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('gender')}
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Male">{t('gender_male')}</option>
              <option value="Female">{t('gender_female')}</option>
              <option value="Other">{t('gender_other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('age_category')}
            </label>
            <select
              name="age_group"
              value={formData.age_group}
              onChange={handleChange}
              className="input-field"
            >
              <option value="Below 14">{t('age_below_14')}</option>
              <option value="15-40">{t('age_15_40')}</option>
              <option value="40+">{t('age_40_plus')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('designation')}
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="input-field"
            >
              <option value="student">{t('designation_student')}</option>
              <option value="professional">{t('designation_professional')}</option>
              <option value="business">{t('designation_business')}</option>
              <option value="individual">{t('designation_individual')}</option>
              <option value="retired">{t('designation_retired')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? t('loading') : t('btn_login')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
