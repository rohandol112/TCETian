# Use Node.js 18 LTS (Alpine for smaller image size)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for better performance and security
RUN apk add --no-cache \
    dumb-init \
    tini \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tcetian -u 1001

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy source code
COPY --chown=tcetian:nodejs . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads/events uploads/profiles uploads/posts && \
    chown -R tcetian:nodejs uploads && \
    chmod -R 755 uploads

# Remove unnecessary files
RUN rm -rf \
    test-* \
    debug-* \
    load-tests \
    *.test.js \
    .env.example \
    README.md \
    API_DOCUMENTATION.md

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV ENABLE_CLUSTERING=false
ENV ENABLE_REDIS=false

# Expose port
EXPOSE 5000

# Switch to non-root user
USER tcetian

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const http = require('http'); \
        const options = { \
            hostname: 'localhost', \
            port: process.env.PORT || 5000, \
            path: '/health', \
            timeout: 2000 \
        }; \
        const req = http.get(options, (res) => { \
            if (res.statusCode === 200) { \
                console.log('Health check passed'); \
                process.exit(0); \
            } else { \
                console.log('Health check failed with status:', res.statusCode); \
                process.exit(1); \
            } \
        }); \
        req.on('error', (err) => { \
            console.log('Health check error:', err.message); \
            process.exit(1); \
        }); \
        req.on('timeout', () => { \
            console.log('Health check timeout'); \
            req.destroy(); \
            process.exit(1); \
        });"

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "src/app.js"]