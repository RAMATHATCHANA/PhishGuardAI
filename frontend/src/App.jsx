import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Modules from './pages/Modules'
import Trends from './pages/Trends'
import Profile from './pages/Profile'

function App() {
  const { i18n } = useTranslation()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {isLoggedIn && (
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme}
            currentLanguage={i18n.language}
            changeLanguage={(lng) => i18n.changeLanguage(lng)}
          />
        )}
        
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/upload" 
            element={isLoggedIn ? <Upload /> : <Navigate to="/" />} 
          />
          <Route 
            path="/modules" 
            element={isLoggedIn ? <Modules /> : <Navigate to="/" />} 
          />
          <Route 
            path="/trends" 
            element={isLoggedIn ? <Trends /> : <Navigate to="/" />} 
          />
          <Route 
            path="/profile" 
            element={isLoggedIn ? <Profile /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
