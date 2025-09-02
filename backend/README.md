# AI Caller Backend

A modular Node.js backend API for the AI Caller application, built with Express.js and MySQL.

## 🏗️ Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection and initialization
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes (login, logout)
│   ├── plans.js             # Plans management routes
│   ├── clients.js           # Client management routes
│   ├── agents.js            # AI agents management routes
│   ├── admin.js             # Admin users and roles routes
│   ├── elevenlabs.js        # ElevenLabs API integration routes
│   ├── knowledgeBase.js     # Knowledge base management routes
│   ├── sales.js             # Sales persons and referrals routes
│   ├── referrals.js         # Referral tracking routes
│   ├── users.js             # Client users and roles routes
│   ├── languages.js         # Language management routes
│   ├── mcp.js               # MCP servers management routes
│   └── secrets.js           # Workspace secrets management routes
├── services/
│   └── emailService.js      # Email service for notifications
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
└── README.md                # This file
```

## ✨ Features

- **Modular Architecture**: Clean separation of concerns with dedicated route files
- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Database Management**: MySQL database with automatic table creation
- **Email Service**: Automated email notifications for clients and plan assignments
- **ElevenLabs Integration**: Full API integration for AI voice agents
- **File Upload**: Multer-based file upload handling
- **CORS Support**: Configurable CORS for cross-origin requests
- **Error Handling**: Comprehensive error handling and logging

## 🚀 Prerequisites

- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 📦 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd ai-caller/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your actual configuration values:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ai-caller
   JWT_SECRET=your-secret-key
   ELEVENLABS_API_KEY=your-api-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up MySQL database**:
   - Create a MySQL database named `ai-caller`
   - The application will automatically create all required tables on first run

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

### Using the Start Script (Windows)
```bash
start.bat
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 🔧 API Endpoints

### Authentication
- `POST /api/login` - Combined login for admins and clients
- `POST /api/logout` - Logout and clear session

### Plans Management
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create a new plan
- `PUT /api/plans/:id` - Update a plan
- `DELETE /api/plans/:id` - Delete a plan
- `POST /api/plans/assigned-plans` - Assign plan to client

### Clients Management
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client
- `POST /api/clients/:id/send-welcome-email` - Send welcome email

### Agents Management
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an agent
- `DELETE /api/agents/:id` - Delete an agent
- `GET /api/agents/:agentId/voice-settings` - Get agent voice settings
- `PUT /api/agents/:agentId/voice-settings` - Update agent voice settings

### ElevenLabs Integration
- `GET /api/elevenlabs/voices` - Get available voices
- `POST /api/elevenlabs/create-agent` - Create agent in ElevenLabs
- `GET /api/elevenlabs/agents/:agentId/conversations` - Get agent conversations
- `GET /api/elevenlabs/agents/:agentId/analytics` - Get agent analytics

### Admin Management
- `GET /api/admin_users` - Get all admin users
- `POST /api/admin_users` - Create admin user
- `GET /api/admin_users/me` - Get current admin user
- `PUT /api/admin_users/:id` - Update admin user
- `DELETE /api/admin_users/:id` - Delete admin user

### Knowledge Base
- `GET /api/knowledge-base` - Get all knowledge base entries
- `POST /api/knowledge-base` - Create knowledge base entry
- `PUT /api/knowledge-base/:id` - Update knowledge base entry
- `DELETE /api/knowledge-base/:id` - Delete knowledge base entry

### Sales & Referrals
- `GET /api/sales-persons` - Get all sales persons
- `GET /api/sales-persons/:id/referrals` - Get sales person referrals
- `POST /api/sales-persons/:id/generate-referral-code` - Generate referral code
- `GET /api/referrals` - Get all referrals
- `POST /api/referrals` - Create referral

### Users & Roles
- `GET /api/client-users` - Get all client users
- `POST /api/client-users` - Create client user
- `GET /api/user-roles` - Get all user roles
- `POST /api/user-roles` - Create user role

### Languages
- `GET /api/languages` - Get all languages
- `GET /api/languages/enabled` - Get enabled languages only
- `POST /api/languages` - Create language
- `PUT /api/languages/:id` - Update language

### MCP Servers
- `GET /api/mcp-servers` - Get all MCP servers
- `POST /api/mcp-servers` - Create MCP server
- `PUT /api/mcp-servers/:id` - Update MCP server
- `DELETE /api/mcp-servers/:id` - Delete MCP server

### Workspace Secrets
- `GET /api/workspace-secrets` - Get all workspace secrets
- `POST /api/workspace-secrets` - Create workspace secret
- `PUT /api/workspace-secrets/:id` - Update workspace secret
- `DELETE /api/workspace-secrets/:id` - Delete workspace secret

## 🔒 Authentication

The API uses JWT tokens stored in HTTP-only cookies for authentication. Include the authentication middleware in protected routes:

```javascript
const { authenticateJWT } = require('./middleware/auth');

router.get('/protected-route', authenticateJWT, (req, res) => {
  // Access user info via req.user
  res.json({ user: req.user });
});
```

## 📧 Email Service

The application includes an email service for sending notifications:

- Welcome emails for new clients
- Plan assignment notifications
- Custom email templates

Configure SMTP settings in your `.env` file to enable email functionality.

## 🗄️ Database

The application automatically creates the following tables on startup:

- `plans` - Subscription plans
- `clients` - Client companies
- `admin_users` - Admin users
- `agents` - AI agents
- `languages` - Supported languages
- `knowledge_base` - Knowledge base entries
- `agent_knowledge_base` - Agent-knowledge base mappings
- `assigned_plans` - Client plan assignments
- `referrals` - Referral tracking
- `sales_admin_referral_codes` - Sales admin referral codes
- `user_roles` - User role definitions
- `client_users` - Client users
- `admin_roles` - Admin role definitions
- `workspace_secrets` - ElevenLabs workspace secrets
- `mcp_servers` - MCP server configurations
- `agent_voice_settings` - Agent voice configurations
- `agent_widget_settings` - Agent widget configurations
- `agent_advanced_settings` - Agent advanced settings

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure MySQL is running
   - Check database credentials in `.env`
   - Verify database `ai-caller` exists

2. **Port Already in Use**:
   - Change the `PORT` in `.env` file
   - Kill existing processes using the port

3. **JWT Token Issues**:
   - Ensure `JWT_SECRET` is set in `.env`
   - Check cookie settings for CORS

4. **Email Service Not Working**:
   - Verify SMTP credentials in `.env`
   - Check if 2FA is enabled (use app password for Gmail)

### Logs

The application logs important events to the console:
- Database connection status
- Authentication attempts
- Email sending status
- API errors

## 🔄 Migration from Monolithic Structure

If migrating from the original `server.js` file:

1. **Backup your data**: Export your MySQL database
2. **Update environment variables**: Use the new `.env` structure
3. **Test all endpoints**: Verify all API endpoints work correctly
4. **Update frontend**: Ensure frontend points to correct API endpoints

## 📝 Development

### Adding New Routes

1. Create a new route file in `routes/` directory
2. Define your routes with proper error handling
3. Import and use the route in `server.js`
4. Add authentication middleware if needed

### Adding New Services

1. Create service files in `services/` directory
2. Export functions for use in routes
3. Import services in route files as needed

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include JSDoc comments for complex functions
4. Test all new endpoints
5. Update this README if adding new features

## 📄 License

This project is licensed under the MIT License.