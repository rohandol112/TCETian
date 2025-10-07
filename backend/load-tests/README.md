# Load Testing Configuration for TCETian

## Overview
This directory contains load testing configurations to verify that the application can handle high-concurrency scenarios.

## Tools
- **Artillery.js**: Recommended load testing tool
- **K6**: Alternative load testing solution

## Test Scenarios

### 1. Basic API Load Test
Tests the core API endpoints under load:
- Authentication endpoints
- Post creation/retrieval
- Event management
- Real-time features

### 2. Concurrent User Simulation
Simulates realistic user behavior:
- Login flows
- Social interactions (posting, commenting, voting)
- Event browsing and RSVP
- Profile updates

### 3. Database Stress Test
Tests database performance under heavy load:
- Connection pool limits
- Query performance with large datasets
- Index effectiveness

## Quick Start

### Install Artillery
```bash
npm install -g artillery@latest
```

### Run Load Tests
```bash
# Basic API test (100 concurrent users)
artillery run load-tests/basic-api-test.yml

# Stress test (500 concurrent users)
artillery run load-tests/stress-test.yml

# Spike test (1000 concurrent users)
artillery run load-tests/spike-test.yml
```

### View Reports
```bash
# Generate HTML report
artillery report test-results.json --output report.html
```

## Expected Performance Targets

### Current Infrastructure (MongoDB Atlas Free)
- **Target**: 200-300 concurrent users
- **Response Time**: < 500ms (95th percentile)
- **Error Rate**: < 1%

### Optimized Infrastructure (With Redis + Clustering)
- **Target**: 800-1000 concurrent users  
- **Response Time**: < 300ms (95th percentile)
- **Error Rate**: < 0.5%

### Production Infrastructure (MongoDB Atlas M2+)
- **Target**: 2000+ concurrent users
- **Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 0.1%

## Monitoring During Tests

### Performance Endpoints
- `GET /api/performance/stats` - System performance metrics
- `GET /api/performance/connections` - Database connection health
- `GET /api/performance/capacity/:targetUsers` - Capacity analysis

### Key Metrics to Watch
1. **Response Times**: Average and 95th percentile
2. **Error Rates**: 4xx and 5xx responses
3. **Database Connections**: Pool utilization
4. **Memory Usage**: Heap and RSS memory
5. **CPU Usage**: System load average

## Troubleshooting

### Common Issues
1. **Connection Pool Exhausted**: Increase `maxPoolSize` in database.js
2. **Memory Leaks**: Monitor heap usage and implement proper cleanup
3. **Rate Limiting**: Adjust rate limiter settings in app.js
4. **Socket.io Issues**: Verify WebSocket connection handling

### Performance Tuning
1. Enable Redis caching: Set `ENABLE_REDIS=true`
2. Enable clustering: Set `ENABLE_CLUSTERING=true`
3. Optimize database queries with proper indexing
4. Implement CDN for static assets in production

## Production Deployment Checklist

- [ ] MongoDB Atlas upgraded to M2 or higher
- [ ] Redis cache configured (Redis Cloud or ElastiCache)
- [ ] Clustering enabled with PM2
- [ ] Load balancer configured
- [ ] CDN setup for static assets
- [ ] Monitoring and alerting configured
- [ ] Database indexes optimized
- [ ] Error logging configured
- [ ] Backup strategy implemented
- [ ] SSL/TLS certificates configured