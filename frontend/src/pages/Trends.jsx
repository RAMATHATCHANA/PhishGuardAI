import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'

// Use relative URLs - Vite proxy will forward to backend
const API_URL = ''

const Trends = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        type_counts: {},
        user_groups: {},
        recent_logs: []
      })
    } finally {
      setLoading(false)
    }
  }

  const getChannelData = () => {
    if (!stats) return []
    
    const channels = ['text', 'url', 'qr', 'screenshot', 'voice']
    return channels.map(channel => ({
      name: t(`channel_${channel}`) || channel,
      Safe: stats.type_counts[channel]?.Safe || 0,
      Phishing: stats.type_counts[channel]?.Phishing || 0
    }))
  }

  const getUserGroupData = () => {
    if (!stats) return []
    
    return Object.entries(stats.user_groups).map(([group, count]) => ({
      name: t(`designation_${group}`) || group,
      count
    }))
  }

  const getHeatmapData = () => {
    const regions = [
      { name: 'North', value: Math.floor(Math.random() * 100) },
      { name: 'South', value: Math.floor(Math.random() * 100) },
      { name: 'East', value: Math.floor(Math.random() * 100) },
      { name: 'West', value: Math.floor(Math.random() * 100) },
      { name: 'Central', value: Math.floor(Math.random() * 100) }
    ]
    return regions
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('trends_title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('trends_subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('detection_by_channel')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChannelData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Safe" fill="#10b981" />
              <Bar dataKey="Phishing" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('user_activity')}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getUserGroupData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('detection_heatmap')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {getHeatmapData().map((region, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg text-white text-center"
                  style={{
                    backgroundColor: `rgba(239, 68, 68, ${region.value / 100})`
                  }}
                >
                  <div className="font-semibold">{region.name}</div>
                  <div className="text-2xl font-bold">{region.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {t('recent_scans')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Time</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Result</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Score</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_logs?.slice(0, 10).map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {log.type}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.label === 'Safe' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {log.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {(log.score * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Trends
