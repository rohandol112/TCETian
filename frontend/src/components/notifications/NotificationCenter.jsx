import { useState } from 'react'
import { FiBell, FiX, FiCheck, FiMessageCircle, FiHeart, FiUserPlus } from 'react-icons/fi'
import { useSocket } from '../../context/SocketContext'

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, markNotificationAsRead, clearNotifications, isConnected } = useSocket()

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <FiMessageCircle className="w-4 h-4 text-blue-400" />
      case 'vote':
        return <FiHeart className="w-4 h-4 text-red-400" />
      case 'follow':
        return <FiUserPlus className="w-4 h-4 text-green-400" />
      default:
        return <FiBell className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now - notificationTime) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <FiBell className={`w-6 h-6 ${isConnected ? 'text-white' : 'text-gray-400'}`} />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Online Status Indicator */}
        <div className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
          isConnected ? 'bg-green-400' : 'bg-gray-500'
        }`} />
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Live' : 'Offline'}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-purple-400 hover:text-purple-300 ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-xs mt-1">You'll see real-time updates here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id || notification.timestamp}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markNotificationAsRead(notification.id)
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-white"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 bg-white/5">
              <button className="w-full text-xs text-purple-400 hover:text-purple-300 transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationCenter