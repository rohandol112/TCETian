import { useState, useEffect } from 'react'
import { FiUsers, FiWifi, FiWifiOff } from 'react-icons/fi'
import { useSocket } from '../../context/SocketContext'

const OnlineStatus = () => {
  const { isConnected, onlineUsers } = useSocket()
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="relative">
      {/* Status Indicator */}
      <div 
        className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-300 cursor-pointer ${
          isConnected 
            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isConnected ? (
          <FiWifi className="w-4 h-4" />
        ) : (
          <FiWifiOff className="w-4 h-4" />
        )}
        
        <FiUsers className="w-4 h-4" />
        <span className="font-medium">{onlineUsers}</span>
        
        {/* Pulse animation for online status */}
        {isConnected && (
          <div className="relative">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>

      {/* Details Tooltip */}
      {showDetails && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="text-center">
            <div className={`flex items-center justify-center space-x-2 mb-2 ${
              isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              {isConnected ? (
                <FiWifi className="w-5 h-5" />
              ) : (
                <FiWifiOff className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm text-gray-300 mb-2">
              {isConnected 
                ? 'Real-time updates active'
                : 'Reconnecting...'
              }
            </div>
            
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
              <FiUsers className="w-3 h-3" />
              <span>{onlineUsers} users online</span>
            </div>
          </div>
          
          {/* Arrow pointing up */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-l border-t border-white/20 rotate-45"></div>
        </div>
      )}

      {/* Click outside to close */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  )
}

export default OnlineStatus