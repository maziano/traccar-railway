# Traccar Railway Deployment

This repository contains the configuration files needed to deploy Traccar GPS tracking platform on Railway.

## Prerequisites

- Railway account
- Railway CLI installed
- PostgreSQL database service on Railway

## Deployment Steps

### 1. Set up Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Add PostgreSQL Database

In your Railway dashboard:
1. Click "New Service"
2. Select "Database" → "PostgreSQL"
3. Note the connection details

### 3. Configure Environment Variables

Set these environment variables in Railway dashboard:

```
DATABASE_HOST=<your_postgres_host>
DATABASE_PORT=<your_postgres_port>
DATABASE_NAME=<your_postgres_database>
DATABASE_USER=<your_postgres_user>
DATABASE_PASSWORD=<your_postgres_password>
PORT=8082
```

Optional email configuration:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_SSL=false
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

### 4. Deploy

```bash
# Deploy to Railway
railway up
```

## Post-Deployment

1. Access your Traccar instance at the Railway-provided URL
2. Default login: admin/admin
3. Change the default password immediately
4. Configure your GPS devices to send data to your Railway URL

## Supported Protocols

Due to Railway's HTTP-only nature, this deployment primarily supports:
- HTTP-based protocols
- Webhook-based tracking
- OsmAnd protocol via HTTP

For TCP-based GPS devices, consider using HTTP forwarding or webhook configurations.

## Troubleshooting

- Check Railway logs for any startup issues
- Ensure database connection variables are correct
- Verify PostgreSQL database is running and accessible
- Check that PORT environment variable matches Dockerfile EXPOSE port

## Files

- `Dockerfile` - Container configuration
- `conf/traccar.xml` - Traccar server configuration
- `railway.toml` - Railway deployment settings
- `.env.example` - Environment variables template