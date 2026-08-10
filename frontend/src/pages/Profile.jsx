import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'

// Use relative URLs - Vite proxy will forward to backend
const API_URL = ''

const Profile = () => {
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    age_group: '',
    designation: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      setFormData(parsed)
    }
  }, [])

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })

      await axios.post(`${API_URL}/users/register`, formDataToSend)
      localStorage.setItem('user', JSON.stringify(formData))
      setUser(formData)
      setIsEdit(false)
    } catch (error) {
      console.error('Update error:', error)
      alert('Update failed')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('profile_title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('profile_subtitle')}
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          {!isEdit ? (
            <button onClick={() => setIsEdit(true)} className="btn-secondary">
              {t('btn_edit')}
            </button>
          ) : (
            <div className="space-x-3">
              <button onClick={handleSave} className="btn-primary">
                {t('btn_save')}
              </button>
              <button
                onClick={() => {
                  setFormData(user)
                  setIsEdit(false)
                }}
                className="btn-secondary"
              >
                {t('btn_cancel')}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('name')}
            </label>
            {isEdit ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('email')}
            </label>
            {isEdit ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('gender')}
            </label>
            {isEdit ? (
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
            ) : (
              <p className="text-gray-900 dark:text-white">{user.gender}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('age_category')}
            </label>
            {isEdit ? (
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
            ) : (
              <p className="text-gray-900 dark:text-white">{user.age_group}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('designation')}
            </label>
            {isEdit ? (
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
            ) : (
              <p className="text-gray-900 dark:text-white capitalize">{user.designation}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
