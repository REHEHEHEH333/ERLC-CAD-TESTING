# Deployment Guide

This Police CAD/MDT system is designed to be multi-user with real-time synchronization across all connected clients.

## Hosting Options

### Option 1: Heroku (Recommended for Quick Setup)

1. **Create a Heroku account** at https://heroku.com

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

5. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   heroku config:set JWT_SECRET=your_secure_secret_key
   heroku config:set NODE_ENV=production
   ```

6. **Create a Procfile** (already included)
   ```
   web: node server.js
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 2: Railway.app

1. Go to https://railway.app
2. Connect your GitHub repository
3. Add MongoDB plugin
4. Set environment variables in the dashboard
5. Deploy automatically on push

### Option 3: Render

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add MongoDB database
7. Deploy

### Option 4: Self-Hosted (VPS/Dedicated Server)

1. **SSH into your server**
2. **Install Node.js and npm**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install MongoDB**
   ```bash
   sudo apt-get install -y mongodb
   ```

4. **Clone repository**
   ```bash
   git clone https://github.com/REHEHEHEH333/ERLC-CAD-TESTING.git
   cd ERLC-CAD-TESTING
   ```

5. **Install dependencies**
   ```bash
   npm install
   ```

6. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

7. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "police-cad"
   pm2 startup
   pm2 save
   ```

## MongoDB Setup

### MongoDB Atlas (Cloud - Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Create a database user
5. Get connection string
6. Add to `.env` as `MONGODB_URI`

### Local MongoDB

For development:
```bash
# Install MongoDB
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb

# Local connection string
MONGODB_URI=mongodb://localhost:27017/police-cad
```

## GitHub Pages Frontend (Optional)

If you want to host the frontend on GitHub Pages:

1. Create a `gh-pages` branch
2. Configure the build to output to `docs/`
3. Enable GitHub Pages in repository settings
4. Point frontend to your backend API

## SSL/HTTPS Setup

### Using Nginx as Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Using Let's Encrypt (Free SSL)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

## Multi-User Configuration

The system is built for multi-user access:

- **Real-time synchronization** via WebSocket (Socket.IO)
- **User authentication** with JWT tokens
- **Role-based access control** (Dispatcher, Officer, Admin)
- **Concurrent session management** via Socket.IO

### User Roles

- **Admin**: Full system access
- **Dispatcher**: Create calls, assign units, manage dispatch
- **Officer**: View calls, update status, search citizens/vehicles

## Monitoring & Logging

```bash
# View logs on Heroku
heroku logs --tail

# View logs on self-hosted with PM2
pm2 logs police-cad

# Monitor real-time metrics
pm2 monit
```

## Database Backup

### MongoDB Atlas
- Automatic backups enabled by default
- Manual backups available in Atlas console

### Local MongoDB
```bash
mongodump --db police-cad --out ./backup

# Restore
mongorestore --db police-cad ./backup/police-cad
```

## Performance Optimization

1. **Enable gzip compression** in server
2. **Use CDN for static files**
3. **Implement caching strategies**
4. **Monitor database indexes**
5. **Scale horizontally** with load balancer

## Troubleshooting

### MongoDB Connection Failed
- Check connection string in `.env`
- Verify MongoDB service is running
- Check firewall rules
- Verify user credentials

### WebSocket Connection Issues
- Check CORS settings
- Verify Socket.IO port is open
- Check firewall for WebSocket connections

### High Memory Usage
- Monitor with `pm2 monit`
- Check for memory leaks
- Increase server resources

## Security Checklist

- [ ] Change JWT_SECRET to strong random key
- [ ] Use HTTPS/SSL
- [ ] Set secure MongoDB credentials
- [ ] Enable CORS only for your domain
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Regular security updates for dependencies
- [ ] Monitor for suspicious activity

## Environment Variables Reference

```
PORT                 - Server port (default: 5000)
MONGODB_URI          - MongoDB connection string (required)
JWT_SECRET           - JWT signing key (required)
NODE_ENV             - Environment (development/production)
CORS_ORIGIN          - CORS allowed origins
```

## Support

For issues or questions, open an issue on GitHub:
https://github.com/REHEHEHEH333/ERLC-CAD-TESTING/issues
