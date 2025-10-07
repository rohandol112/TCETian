const absoluteUrlPattern = /^https?:\/\//i

const deriveMediaBaseUrl = () => {
  const explicit = import.meta.env.VITE_MEDIA_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
  if (apiUrl) {
    return apiUrl.replace(/\/?api\/?$/i, '').replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

const mediaBaseUrl = deriveMediaBaseUrl()

export const resolveMediaUrl = (url) => {
  if (!url) return ''

  if (absoluteUrlPattern.test(url)) {
    return url
  }

  const base = mediaBaseUrl
  if (!base) {
    return url.startsWith('/') ? url : `/${url}`
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${base}${normalizedPath}`
}

export const getMediaBaseUrl = () => mediaBaseUrl
