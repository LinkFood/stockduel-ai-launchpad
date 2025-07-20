import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import LandingScreen from './components/LandingScreen'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { mockStocks, mockContest } from './components/MockData'

function App() {
  const { 
    initializeApp, 
    isLoading, 
    error,
    setFeaturedStocks,
    setCurrentContestPeriod,
    setLoading
  } = useAppStore()

  useEffect(() => {
    // For demo purposes, load mock data instead of real API
    setLoading(false)
    setFeaturedStocks(mockStocks)
    setCurrentContestPeriod(mockContest)
    
    // Uncomment this for real API initialization:
    // initializeApp()
  }, [setFeaturedStocks, setCurrentContestPeriod, setLoading])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={initializeApp} />
  }

  return <LandingScreen />
}

export default App