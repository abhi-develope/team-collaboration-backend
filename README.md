# Team Collaboration Platform - Backend

A robust Node.js/Express backend API for a real-time team collaboration platform. Built with MongoDB, Socket.io, and JWT authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)

## ✨ Features

- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- **Real-time Communication** - Socket.io for instant messaging and notifications
- **Project Management** - Create, update, and manage collaborative projects
- **Task Management** - Full CRUD operations for project tasks
- **Team Management** - Manage team members and their roles
- **Message System** - Real-time chat messaging between team members
- **Role-based Access Control** - Different permission levels for team members
- **Validation** - Request validation using Joi
- **Security** - Helmet for HTTP headers, CORS configuration, rate limiting
- **Error Handling** - Comprehensive error handling and logging
- **Database** - MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express** 4.18.2 - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** 8.0.3 - MongoDB object modeling
- **Socket.io** 4.6.0 - Real-time bidirectional communication
- **JWT (jsonwebtoken)** 9.0.2 - Token-based authentication
- **bcryptjs** 2.4.3 - Password hashing
- **Joi** 17.11.0 - Data validation
- **Helmet** 7.1.0 - Security headers
- **CORS** 2.8.5 - Cross-origin resource sharing
- **Express Rate Limit** 7.1.5 - Rate limiting middleware
- **Dotenv** 16.3.1 - Environment variable management
- **Nodemon** 3.0.2 - Development auto-reload (dev only)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **MongoDB** - Local instance or MongoDB Atlas account
- **Git** (optional, for version control)

Verify installation:
```bash
node --version
npm --version
```

### MongoDB Setup

#### Option 1: Local MongoDB
Install MongoDB Community Edition and start the service:
```bash
# Windows
mongod

# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd team-collaboration-backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and update the values according to your setup:

```dotenv
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/team-collaboration

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

See [Environment Variables](#environment-variables) section for detailed explanations.

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` with auto-reload enabled via Nodemon.

For production:
```bash
npm start
```

## 📝 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Environment Variables File (`.env.example`)

```dotenv
# Backend Environment Variables
# Copy this file to .env and update the values accordingly

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/team-collaboration

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/team-collaboration?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Variable Details

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `5000` | Yes |
| `NODE_ENV` | Environment mode | `development` or `production` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/team-collaboration` | Yes |
| `JWT_SECRET` | Secret key for JWT signing | `your_super_secret_key_123!@#` | Yes |
| `JWT_EXPIRY` | JWT token expiration time | `7d`, `24h`, `30d` | Yes |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 minutes) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Important Security Notes

⚠️ **Never commit `.env` file to version control!**

- Change `JWT_SECRET` in production to a strong random string
- Keep all secrets confidential
- Use a `.gitignore` to exclude `.env` files
- Rotate secrets regularly in production

## 📜 Available Scripts

### Development Server (Recommended for Development)

```bash
npm run dev
```

Starts the server with Nodemon for automatic restart on file changes. Runs on `http://localhost:5000`

### Production Server

```bash
npm start
```

Starts the server in production mode. Ensure `NODE_ENV=production` in `.env`

### Testing

```bash
npm test
```

Runs test suite (Currently not configured - can be set up with Jest or Mocha)

## 📁 Project Structure

```
team-collaboration-backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── config/
│   │   ├── constants.js          # Application constants
│   │   └── database.js           # MongoDB connection setup
│   ├── controllers/              # Request handlers
│   │   ├── authController.js     # Authentication logic
│   │   ├── messageController.js  # Message operations
│   │   ├── projectController.js  # Project operations
│   │   ├── taskController.js     # Task operations
│   │   └── teamController.js     # Team operations
│   ├── middleware/               # Express middleware
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── errorHandler.js       # Error handling
│   │   ├── roleMiddleware.js     # Role-based access
│   │   └── validateRequest.js    # Request validation
│   ├── models/                   # Mongoose schemas
│   │   ├── Message.js            # Message model
│   │   ├── Project.js            # Project model
│   │   ├── Task.js               # Task model
│   │   ├── Team.js               # Team model
│   │   └── User.js               # User model
│   ├── routes/                   # API routes
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── index.js              # Main router
│   │   ├── messageRoutes.js      # Message endpoints
│   │   ├── projectRoutes.js      # Project endpoints
│   │   ├── taskRoutes.js         # Task endpoints
│   │   └── teamRoutes.js         # Team endpoints
│   ├── utils/                    # Utility functions
│   │   ├── errorTypes.js         # Custom error classes
│   │   └── responseHandler.js    # Response formatting
│   └── validators/               # Joi validation schemas
│       ├── authValidator.js      # Auth validation
│       ├── messageValidator.js   # Message validation
│       ├── projectValidator.js   # Project validation
│       ├── taskValidator.js      # Task validation
│       └── teamValidator.js      # Team validation
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Project dependencies
└── README.md                     # This file
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |

### Projects Routes (`/api/projects`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | Get all projects | Yes |
| POST | `/` | Create new project | Yes |
| GET | `/:id` | Get project details | Yes |
| PUT | `/:id` | Update project | Yes |
| DELETE | `/:id` | Delete project | Yes |

### Tasks Routes (`/api/tasks`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | Get all tasks | Yes |
| POST | `/` | Create new task | Yes |
| GET | `/:id` | Get task details | Yes |
| PUT | `/:id` | Update task | Yes |
| DELETE | `/:id` | Delete task | Yes |

### Team Routes (`/api/teams`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | Get all teams | Yes |
| POST | `/` | Create new team | Yes |
| GET | `/:id` | Get team details | Yes |
| PUT | `/:id` | Update team | Yes |
| DELETE | `/:id` | Delete team | Yes |
| POST | `/:id/members` | Add member to team | Yes |

### Messages Routes (`/api/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | Get all messages | Yes |
| POST | `/` | Create new message | Yes |
| GET | `/:id` | Get message details | Yes |
| DELETE | `/:id` | Delete message | Yes |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials and returns JWT token
3. Client stores token (typically in localStorage)
4. Client includes token in `Authorization` header: `Bearer <token>`

### Protected Routes

All routes except `/api/auth/register` and `/api/auth/login` require:

```
Authorization: Bearer <jwt_token>
```

## 🔧 Configuration

### Database Connection

Database configuration is in `src/config/database.js`:

```javascript
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### Socket.io Configuration

Real-time features are configured in `src/server.js`:

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});
```

### Rate Limiting

API endpoints are protected with rate limiting:

- **Window**: 15 minutes (900000ms)
- **Max Requests**: 100 per window
- **Configure in `.env`**: `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS`

### CORS

Cross-origin requests are allowed from:

```
CORS_ORIGIN=http://localhost:5173
```

Configure in `.env` for your frontend URL.

## 📊 Database Models

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model

```javascript
{
  name: String,
  description: String,
  owner: ObjectId (User),
  members: [ObjectId] (User),
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model

```javascript
{
  title: String,
  description: String,
  project: ObjectId (Project),
  assignee: ObjectId (User),
  status: String,
  priority: String,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Team Model

```javascript
{
  name: String,
  description: String,
  owner: ObjectId (User),
  members: [ObjectId] (User),
  roles: Map,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  content: String,
  sender: ObjectId (User),
  project: ObjectId (Project),
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

To run tests (when configured):

```bash
npm test
```

## 📦 Deployment

### Build for Production

```bash
npm start
```

### Deployment Options

- **Heroku** - Easy deployment with `Procfile`
- **AWS** - EC2 instances or Elastic Beanstalk
- **DigitalOcean** - Droplets with Node.js
- **Railway** - Simple Node.js hosting
- **Render** - Free tier available

### Pre-deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production `MONGODB_URI`
- [ ] Set correct `CORS_ORIGIN`
- [ ] Enable HTTPS
- [ ] Set up environment variables on hosting platform
- [ ] Test all endpoints thoroughly
- [ ] Set up logging and monitoring
- [ ] Configure backups for database

## 🆘 Troubleshooting

### MongoDB Connection Error

**Error**: `MongooseError: Cannot connect to MongoDB`

**Solution**:
- Verify MongoDB is running locally: `mongod`
- Check MongoDB Atlas connection string
- Ensure firewall allows port 27017
- Verify `MONGODB_URI` in `.env`

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

Or change `PORT` in `.env`

### JWT Token Expired

**Error**: `TokenExpiredError: jwt expired`

**Solution**:
- User needs to login again to get new token
- Check `JWT_EXPIRY` value in `.env`

### CORS Issues

**Error**: `Access to XMLHttpRequest has been blocked by CORS`

**Solution**:
- Update `CORS_ORIGIN` in `.env` to match frontend URL
- Restart server after changing `.env`
- Check frontend `VITE_API_URL`

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make your changes and commit: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/my-feature`
4. Submit a pull request

## 🆘 Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the API documentation above
3. Check MongoDB and Node.js documentation
4. Contact the development team

---

**Last Updated**: December 2024
