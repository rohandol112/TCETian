/**
 * Connection Test Component
 * Tests if frontend can properly connect to the deployed backend
 */
import { useState, useEffect } from 'react'

const ConnectionTest = () => {
  const [backendStatus, setBackendStatus] = useState('testing')
  const [apiResponse, setApiResponse] = useState(null)
  const [error, setError] = useState(null)

  const testBackendConnection = async () => {
    try {
      setBackendStatus('testing')
      setError(null)

      // Test 1: Health check
      const healthResponse = await fetch('https://tcetian.onrender.com/health')
      const healthData = await healthResponse.json()

      // Test 2: API endpoint
      const apiResponse = await fetch('https://tcetian.onrender.com/api/auth/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      })

      if (apiResponse.ok) {
        const apiData = await apiResponse.json()
        setApiResponse({
          health: healthData,
          api: apiData,
          status: 'connected'
        })
        setBackendStatus('connected')
      } else {
        throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`)
      }

    } catch (err) {
      console.error('Backend connection test failed:', err)
      setError(err.message)
      setBackendStatus('failed')
    }
  }

  useEffect(() => {
    testBackendConnection()
  }, [])

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'testing': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return '✅'
      case 'failed': return '❌'
      case 'testing': return '🔄'
      default: return '⏳'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-md">
      <h3 className="text-white font-semibold mb-3">🔗 Backend Connection Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span>{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            Status: {backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
          </span>
        </div>

        <div className="text-sm text-gray-300">
          <div>🌐 Backend: https://tcetian.onrender.com</div>
          <div>🎯 Frontend: https://tcetian.vercel.app</div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-2 text-red-300 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {apiResponse && (
          <div className="bg-green-500/20 border border-green-500/30 rounded p-2 text-green-300 text-xs">
            <div><strong>Health:</strong> {apiResponse.health?.message}</div>
            <div><strong>Environment:</strong> {apiResponse.health?.env}</div>
            {apiResponse.api && (
              <div><strong>API:</strong> Connected successfully</div>
            )}
          </div>
        )}

        <button 
          onClick={testBackendConnection}
          className="w-full mt-3 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded font-medium transition-colors"
        >
          🔄 Test Again
        </button>
      </div>
    </div>
  )
}

export default ConnectionTest