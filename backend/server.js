#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting TCETian Backend Server...')

const server = spawn('node', ['src/app.js'], {
  cwd: path.join(__dirname),
  stdio: 'inherit'
})

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})

server.on('close', (code) => {
  console.log(`📴 Server process exited with code ${code}`)
  if (code !== 0) {
    process.exit(code)
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down server...')
  server.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n📴 Shutting down server...')
  server.kill('SIGTERM')
})