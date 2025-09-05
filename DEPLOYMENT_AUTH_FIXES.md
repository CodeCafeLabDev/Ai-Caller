# Authentication Fixes for Server Deployment

## Issues Fixed

### 1. JWT Secret Security
- **Problem**: Using fallback JWT secret which is insecure
- **Fix**: Server now requires JWT_SECRET environment variable and exits if not provided
- **Action Required**: Set a strong JWT_SECRET in your production environment

### 2. Cookie Configuration
- **Problem**: Inconsistent cookie settings between admin and client login
- **Fix**: Standardized cookie configuration for production vs development
- **Production Settings**: `sameSite: 'none'`, `secure: true`
- **Development Settings**: `sameSite: 'lax'`, `secure: false`

### 3. CORS Configuration
- **Problem**: Missing optionsSuccessStatus for legacy browser support
- **Fix**: Added `optionsSuccessStatus: 200` to CORS configuration

### 4. Error Handling
- **Problem**: Poor error logging for authentication failures
- **Fix**: Added detailed logging for token verification failures

## Production Environment Variables Required

Create a `.env` file in your backend directory with these variables:

```bash
# Database Configuration
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password
DB_NAME=ai-caller

# JWT Secret Key - MUST be a strong, unique secret
JWT_SECRET=your-very-secure-jwt-secret-key-change-this-in-production

# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_production_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_production_email@gmail.com

# Server Configuration
PORT=5000
NODE_ENV=production

# Commission Configuration
COMMISSION_PERCENT=10

# Frontend URL
FRONTEND_URL=https://your-production-domain.com
```

## Database Deployment Steps

### Step 1: Export Your Local Database
```bash
# Export database structure and data
mysqldump -u root -p ai-caller > ai-caller-backup.sql

# Or export only structure (if you want fresh data)
mysqldump -u root -p --no-data ai-caller > ai-caller-structure.sql
```

### Step 2: Create Production Database
```bash
# Connect to your production MySQL server
mysql -h your_production_host -u your_production_user -p

# Create database
CREATE DATABASE `ai-caller`;

# Exit MySQL
exit;
```

### Step 3: Import Database to Production
```bash
# Import the backup to production
mysql -h your_production_host -u your_production_user -p ai-caller < ai-caller-backup.sql
```

### Step 4: Verify Database Connection
```bash
# Test connection
mysql -h your_production_host -u your_production_user -p ai-caller -e "SHOW TABLES;"
```

## Server Deployment Checklist

### Before Deployment:
- [ ] Set `NODE_ENV=production` in environment variables
- [ ] Set a strong, unique `JWT_SECRET`
- [ ] Configure production database credentials
- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Ensure all API keys are production-ready

### After Deployment:
- [ ] Test login functionality
- [ ] Verify cookies are being set correctly
- [ ] Check browser developer tools for any CORS errors
- [ ] Test logout functionality
- [ ] Verify JWT token expiration works

## Common Issues and Solutions

### Issue: "No token provided" error
**Solution**: 
1. Check if `NODE_ENV=production` is set
2. Verify JWT_SECRET is configured
3. Check browser cookies - should see `token` cookie with `Secure` and `SameSite=None` flags

### Issue: CORS errors
**Solution**:
1. Add your production domain to the allowed origins in `server.js`
2. Ensure `credentials: true` is set in CORS configuration

### Issue: Cookies not persisting
**Solution**:
1. Verify `secure: true` and `sameSite: 'none'` for production
2. Check if your domain uses HTTPS
3. Ensure `httpOnly: true` is set

## Testing Authentication

### Test Admin Login:
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}' \
  -c cookies.txt
```

### Test Client Login:
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"your_password"}' \
  -c cookies.txt
```

### Test Protected Route:
```bash
curl -X GET https://your-domain.com/api/protected-route \
  -b cookies.txt
```

## Security Recommendations

1. **JWT Secret**: Use a cryptographically secure random string (at least 32 characters)
2. **Database**: Use strong passwords and limit database user permissions
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit `.env` files to version control
5. **Regular Updates**: Keep dependencies updated for security patches
