# AI Caller Backend Restructure

## Overview

The backend has been completely restructured from a single `server.js` file into a modular, organized architecture. This improves maintainability, scalability, and makes debugging much easier.

## New Structure

```
Ai-Caller/
├── backend/                    # Backend application
│   ├── config/
│   │   └── database.js        # Database configuration
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/                 # API route modules
│   │   ├── auth.js            # Authentication routes
│   │   ├── agents.js          # AI agent routes
│   │   ├── plans.js           # Subscription plan routes
│   │   ├── clients.js         # Client management routes
│   │   ├── users.js           # User and role routes
│   │   ├── referrals.js       # Referral system routes
│   │   ├── elevenlabs.js      # ElevenLabs integration routes
│   │   ├── email.js           # Email service routes
│   │   └── debug.js           # Debug and maintenance routes
│   ├── services/
│   │   └── emailService.js    # Email service implementation
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── README.md              # Backend documentation
│   ├── start.bat              # Windows startup script
│   └── env.example            # Environment variables template
├── src/                        # Frontend application (unchanged)
├── server.js                   # OLD monolithic server (can be removed)
└── README_BACKEND_RESTRUCTURE.md  # This file
```

## Benefits of the New Structure

1. **Modularity**: Each feature has its own route file
2. **Maintainability**: Easier to find and fix issues
3. **Scalability**: Easy to add new features
4. **Testing**: Individual modules can be tested separately
5. **Team Development**: Multiple developers can work on different modules
6. **Error Isolation**: Issues in one module don't affect others

## How to Run the New Backend

### Option 1: Using the Startup Script (Windows)
1. Navigate to the backend folder
2. Double-click `start.bat`
3. The script will automatically install dependencies and start the server

### Option 2: Manual Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   # Copy the example file
   copy env.example .env
   
   # Edit .env with your actual values
   notepad .env
   ```

4. Start the server:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

Create a `.env` file in the `backend/` folder with these variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai-caller

# JWT Configuration
JWT_SECRET=your-very-secret-key-change-this-in-production

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Server Configuration
PORT=5000
NODE_ENV=development

# Commission Configuration
COMMISSION_PERCENT=10
```

## API Endpoints

The API structure remains the same, but now it's organized into logical modules:

- **Authentication**: `/api/auth/*`
- **AI Agents**: `/api/agents/*`
- **Plans**: `/api/plans/*`
- **Clients**: `/api/clients/*`
- **Users**: `/api/users/*`
- **Referrals**: `/api/referrals/*`
- **ElevenLabs**: `/api/elevenlabs/*`
- **Email**: `/api/email/*`
- **Debug**: `/api/debug/*`

## Migration from Old Structure

### What Changed
- Single `server.js` file → Modular structure
- All routes in one place → Separated by feature
- Database logic mixed with routes → Clean separation
- No clear organization → Logical grouping

### What Stayed the Same
- All API endpoints remain identical
- Database schema unchanged
- Frontend integration unchanged
- Environment variables (mostly) unchanged

### Steps to Migrate
1. **Stop the old server** if it's running
2. **Set up the new backend** using instructions above
3. **Test the new backend** to ensure it works
4. **Update any scripts** that reference the old `server.js`
5. **Remove the old `server.js`** once confirmed working

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure you're in the `backend/` folder
   - Run `npm install` to install dependencies

2. **Database connection failed**
   - Check your `.env` file has correct database credentials
   - Ensure MySQL is running

3. **Port already in use**
   - Change `PORT` in `.env` file
   - Or kill the process using the port

4. **JWT authentication issues**
   - Verify `JWT_SECRET` is set in `.env`
   - Check token expiration

### Getting Help

1. Check the `backend/README.md` for detailed backend documentation
2. Verify all environment variables are set correctly
3. Check the console output for specific error messages
4. Ensure all dependencies are installed

## Development Workflow

### Adding New Features
1. Create new route file in `routes/` folder
2. Add middleware if needed in `middleware/` folder
3. Create services if needed in `services/` folder
4. Update `server.js` to include new routes
5. Test thoroughly

### Modifying Existing Features
1. Find the relevant route file in `routes/` folder
2. Make your changes
3. Test the specific endpoint
4. Restart the server if needed

## Performance Benefits

- **Faster startup**: Only loads necessary modules
- **Better memory usage**: Modular loading
- **Easier debugging**: Isolated issues
- **Faster development**: Work on one module at a time

## Security Improvements

- **Better separation of concerns**: Authentication logic isolated
- **Cleaner middleware**: Easier to audit security
- **Modular validation**: Input validation per route
- **Centralized error handling**: Consistent security responses

## Next Steps

1. **Test the new backend** thoroughly
2. **Update your deployment scripts** if any
3. **Train your team** on the new structure
4. **Consider adding tests** for individual modules
5. **Monitor performance** and make improvements

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check the `backend/README.md` for detailed information

The new structure makes the backend much more maintainable and easier to work with. Each module has a single responsibility, making it easier to understand, debug, and extend the application.
