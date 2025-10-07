import apiService from './api.js'

export const eventService = {
  // Get all events with filtering
  async getEvents(params = {}) {
    // Add cache-busting timestamp to prevent stale data
    const cacheParams = { ...params, _t: Date.now() }
    const queryString = new URLSearchParams(cacheParams).toString()
    const endpoint = queryString ? `/events?${queryString}` : `/events?_t=${Date.now()}`
    return await apiService.get(endpoint)
  },

  // Get single event by ID
  async getEvent(eventId) {
    return await apiService.get(`/events/${eventId}`)
  },

  // Create new event (Club only)
  async createEvent(eventData) {
    // Clear cache before creating new event
    apiService.clearCache()
    const result = await apiService.post('/events', eventData)
    // Clear cache after successful creation to ensure fresh data
    if (result.success) {
      apiService.clearCache()
    }
    return result
  },

  // Update event (Club only)
  async updateEvent(eventId, eventData) {
    // Clear cache before updating event
    apiService.clearCache()
    const result = await apiService.put(`/events/${eventId}`, eventData)
    // Clear cache after successful update to ensure fresh data
    if (result.success) {
      apiService.clearCache()
    }
    return result
  },

  // Delete event (Club only)
  async deleteEvent(eventId) {
    return await apiService.delete(`/events/${eventId}`)
  },

  // RSVP to event (Student only)
  async rsvpEvent(eventId) {
    return await apiService.post(`/events/${eventId}/rsvp`)
  },

  // Cancel RSVP (Student only)
  async cancelRSVP(eventId) {
    return await apiService.delete(`/events/${eventId}/rsvp`)
  },

  // Get event attendees (Club only)
  async getEventAttendees(eventId) {
    return await apiService.get(`/events/${eventId}/attendees`)
  },

  // Get dashboard stats (Club only)
  async getDashboardStats(forceRefresh = false) {
    // Always include timestamp to prevent caching issues
    const endpoint = `/events/dashboard/stats?_t=${Date.now()}`
    return await apiService.get(endpoint)
  },

  // Share event
  async shareEvent(eventId) {
    return await apiService.post(`/events/${eventId}/share`)
  },

  // Get event share info
  async getEventShareInfo(eventId) {
    return await apiService.get(`/events/${eventId}/share-info`)
  }
}