#!/usr/bin/env node

// Simple test script to debug tag processing issue

console.log('🧪 Testing Tag Processing Logic')
console.log('=' .repeat(50))

// Simulate what frontend sends
const testCases = [
  {
    name: 'Normal comma-separated string',
    input: 'programming, workshop, networking',
    expected: ['programming', 'workshop', 'networking']
  },
  {
    name: 'Already an array (from editing)',
    input: ['programming', 'workshop', 'networking'],
    expected: ['programming', 'workshop', 'networking']
  },
  {
    name: 'Empty string',
    input: '',
    expected: []
  },
  {
    name: 'Single tag',
    input: 'programming',
    expected: ['programming']
  }
]

// Frontend processing logic
function processFrontendTags(formDataTags) {
  console.log('🏷️ Frontend - Raw formData.tags:', formDataTags, 'Type:', typeof formDataTags)
  
  const tags = typeof formDataTags === 'string' 
    ? formDataTags.split(',').map(tag => tag.trim()).filter(tag => tag)
    : Array.isArray(formDataTags) 
      ? formDataTags.filter(tag => tag && tag.trim())
      : []
  
  console.log('🏷️ Frontend - Processed tags:', tags)
  const jsonString = JSON.stringify(tags)
  console.log('🏷️ Frontend - JSON stringified:', jsonString)
  return jsonString
}

// Backend processing logic
function processBackendTags(jsonString) {
  console.log('🏷️ Backend - Received JSON string:', jsonString, 'Type:', typeof jsonString)
  
  let tags = []
  if (jsonString && typeof jsonString === 'string') {
    try {
      tags = JSON.parse(jsonString)
      console.log('🏷️ Backend - Parsed tags:', tags)
    } catch (err) {
      console.error('❌ Backend - Error parsing tags:', err)
      tags = []
    }
  }
  
  // Ensure tags is array and each tag is under 50 chars
  if (Array.isArray(tags)) {
    tags = tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.length > 50 ? tag.substring(0, 50) : tag)
  }
  
  console.log('🏷️ Backend - Final processed tags:', tags)
  return tags
}

// Test each case
testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`)
  console.log('-'.repeat(40))
  
  try {
    const frontendResult = processFrontendTags(testCase.input)
    const backendResult = processBackendTags(frontendResult)
    
    const success = JSON.stringify(backendResult) === JSON.stringify(testCase.expected)
    console.log(`✅ Expected: ${JSON.stringify(testCase.expected)}`)
    console.log(`${success ? '✅' : '❌'} Result: ${JSON.stringify(backendResult)}`)
    console.log(`${success ? '✅ PASS' : '❌ FAIL'}`)
  } catch (error) {
    console.error('❌ Error in test:', error.message)
  }
})

console.log('\n' + '='.repeat(50))
console.log('🏁 Tag processing test completed')