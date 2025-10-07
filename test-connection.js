#!/usr/bin/env node

/**
 * Test connection to deployed backend
 */

const testConnection = async () => {
  console.log('🔍 Testing TCETian Backend Connection')
  console.log('Backend URL: https://tcetian.onrender.com\n')

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch('https://tcetian.onrender.com/health')
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Health check passed')
      console.log('📊 Backend info:', {
        status: healthData.status,
        env: healthData.env,
        port: healthData.port,
        timestamp: healthData.timestamp
      })
    } else {
      console.log('❌ Health check failed:', healthResponse.status, healthResponse.statusText)
    }

    // Test CORS preflight
    console.log('\n2. Testing CORS for Vercel domain...')
    const corsResponse = await fetch('https://tcetian.onrender.com/api/events', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://tcetian.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    })

    if (corsResponse.ok) {
      console.log('✅ CORS preflight passed')
      const corsHeaders = corsResponse.headers
      console.log('📋 CORS headers:', {
        'Access-Control-Allow-Origin': corsHeaders.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsHeaders.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsHeaders.get('Access-Control-Allow-Headers')
      })
    } else {
      console.log('❌ CORS preflight failed:', corsResponse.status)
    }

    // Test API endpoint
    console.log('\n3. Testing API endpoint...')
    const apiResponse = await fetch('https://tcetian.onrender.com/api/events', {
      method: 'GET',
      headers: {
        'Origin': 'https://tcetian.vercel.app',
        'Content-Type': 'application/json'
      }
    })

    if (apiResponse.ok) {
      console.log('✅ API endpoint accessible')
      const data = await apiResponse.json()
      console.log('📦 Response preview:', {
        success: data.success,
        dataType: typeof data.data,
        eventsCount: data.data?.events?.length || 0
      })
    } else {
      console.log('❌ API endpoint failed:', apiResponse.status, apiResponse.statusText)
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Possible issues:')
      console.log('   - Backend is still starting up (Render free tier can be slow)')
      console.log('   - Network connectivity issues')
      console.log('   - Backend deployment failed')
    }
  }

  console.log('\n🔗 Links to check:')
  console.log('   Backend: https://tcetian.onrender.com/health')
  console.log('   Frontend: https://tcetian.vercel.app')
  console.log('   API: https://tcetian.onrender.com/api/events')
}

testConnection().catch(console.error)