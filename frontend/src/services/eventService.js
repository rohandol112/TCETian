import apiService from './api.js'

export const eventService = {
  // Get all events with filtering
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/events?${queryString}` : '/events'
    return await apiService.get(endpoint)
  },

  // Get single event by ID
  async getEvent(eventId) {
    return await apiService.get(`/events/${eventId}`)
  },

  // Create new event (Club only)
  async createEvent(eventData) {
    return await apiService.post('/events', eventData)
  },

  // Update event (Club only)
  async updateEvent(eventId, eventData) {
    return await apiService.put(`/events/${eventId}`, eventData)
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
  async getDashboardStats() {
    return await apiService.get('/events/dashboard/stats')
  }
}