// Test event creation to debug date and connection issues
import fetch from 'node-fetch'

const testEventCreation = async () => {
  try {
    console.log('🔍 Testing event creation...')
    
    const eventData = {
      title: 'Test Event - Date Debug',
      description: 'Testing date handling and backend connection',
      category: 'Technical',
      eventDate: '2025-10-09',
      eventTime: '15:30',
      duration: 2,
      venue: 'Test Room',
      capacity: 50,
      registrationDeadline: '2025-10-08',
      registrationDeadlineTime: '12:00',
      contactEmail: 'test@tcet.edu.in',
      contactPhone: '1234567890',
      tags: ['test', 'debug'],
      requirements: ['laptop']
    }
    
    console.log('📤 Sending event data:', eventData)
    
    const response = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add proper JWT token here
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify(eventData)
    })
    
    const result = await response.json()
    console.log('📥 Backend response:', result)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Uncomment to run test
// testEventCreation()

export default testEventCreation