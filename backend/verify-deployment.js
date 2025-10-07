#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests if the backend is ready for deployment
 */

import { promises as fs } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

console.log('🔍 TCETian Backend Deployment Verification\n')

const checks = []

// Check 1: Required files exist
const checkRequiredFiles = async () => {
  const requiredFiles = [
    'package.json',
    'src/app.js',
    'Dockerfile',
    '.dockerignore',
    'start.js'
  ]
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file)
      checks.push({ name: `File: ${file}`, status: '✅', message: 'Found' })
    } catch {
      checks.push({ name: `File: ${file}`, status: '❌', message: 'Missing' })
    }
  }
}

// Check 2: Package.json validation
const checkPackageJson = async () => {
  try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
    
    // Check main script
    if (pkg.main === 'src/app.js') {
      checks.push({ name: 'Package.json main', status: '✅', message: 'Correct entry point' })
    } else {
      checks.push({ name: 'Package.json main', status: '⚠️', message: 'Entry point should be src/app.js' })
    }
    
    // Check start script
    if (pkg.scripts && pkg.scripts.start) {
      checks.push({ name: 'Start script', status: '✅', message: pkg.scripts.start })
    } else {
      checks.push({ name: 'Start script', status: '❌', message: 'Missing start script' })
    }
    
    // Check dependencies
    const requiredDeps = ['express', 'mongoose', 'cors', 'dotenv']
    const missing = requiredDeps.filter(dep => !pkg.dependencies || !pkg.dependencies[dep])
    
    if (missing.length === 0) {
      checks.push({ name: 'Dependencies', status: '✅', message: 'All required dependencies found' })
    } else {
      checks.push({ name: 'Dependencies', status: '❌', message: `Missing: ${missing.join(', ')}` })
    }
    
  } catch (error) {
    checks.push({ name: 'Package.json', status: '❌', message: 'Invalid or missing package.json' })
  }
}

// Check 3: Environment variables
const checkEnvVars = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length === 0) {
    checks.push({ name: 'Environment Variables', status: '✅', message: 'All required env vars set' })
  } else {
    checks.push({ name: 'Environment Variables', status: '⚠️', message: `Will need: ${missing.join(', ')}` })
  }
}

// Check 4: Docker setup
const checkDocker = async () => {
  try {
    const dockerfile = await fs.readFile('Dockerfile', 'utf8')
    if (dockerfile.includes('FROM node:18-alpine')) {
      checks.push({ name: 'Dockerfile', status: '✅', message: 'Using Node.js 18 Alpine' })
    } else {
      checks.push({ name: 'Dockerfile', status: '⚠️', message: 'Check Node.js version' })
    }
  } catch {
    checks.push({ name: 'Dockerfile', status: '❌', message: 'Missing Dockerfile' })
  }
}

// Run all checks
const runVerification = async () => {
  await checkRequiredFiles()
  await checkPackageJson()
  checkEnvVars()
  await checkDocker()
  
  console.log('📋 Verification Results:\n')
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name.padEnd(25)} - ${check.message}`)
  })
  
  const errors = checks.filter(check => check.status === '❌').length
  const warnings = checks.filter(check => check.status === '⚠️').length
  const success = checks.filter(check => check.status === '✅').length
  
  console.log('\n📊 Summary:')
  console.log(`   ✅ Passed: ${success}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)
  console.log(`   ❌ Errors: ${errors}`)
  
  if (errors === 0) {
    console.log('\n🎉 Backend is ready for deployment!')
    console.log('\n📝 Next steps:')
    console.log('   1. Push code to GitHub')
    console.log('   2. Create Render web service')
    console.log('   3. Set environment variables in Render')
    console.log('   4. Deploy and test')
  } else {
    console.log('\n⚠️  Please fix the errors above before deploying.')
  }
  
  if (warnings > 0) {
    console.log('\n💡 Warnings indicate things to configure during deployment.')
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Verification failed:', error.message)
  process.exit(1)
})

// Run verification
runVerification().catch(console.error)