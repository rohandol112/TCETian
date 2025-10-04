import { createContext, useContext, useState } from 'react'
import Swal from 'sweetalert2'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const showToast = (type, title, text) => {
    const config = {
      title,
      text,
      icon: type,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: 'rgba(15, 12, 41, 0.95)',
      color: '#fff',
      iconColor: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B'
    }

    Swal.fire(config)
  }

  const showSuccess = (title, text = '') => showToast('success', title, text)
  const showError = (title, text = '') => showToast('error', title, text)
  const showWarning = (title, text = '') => showToast('warning', title, text)
  const showInfo = (title, text = '') => showToast('info', title, text)

  const showConfirm = async (title, text, confirmText = 'Yes', cancelText = 'No') => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      background: 'rgba(15, 12, 41, 0.95)',
      color: '#fff',
      confirmButtonColor: '#8B5CF6',
      cancelButtonColor: '#6B7280'
    })

    return result.isConfirmed
  }

  // Unified showToast function for backward compatibility
  const showToastUnified = (message, type = 'info', title = '') => {
    switch(type) {
      case 'success':
        return showSuccess(title || 'Success', message)
      case 'error':
        return showError(title || 'Error', message)
      case 'warning':
        return showWarning(title || 'Warning', message)
      case 'info':
      default:
        return showInfo(title || 'Info', message)
    }
  }

  const value = {
    showToast: showToastUnified,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}