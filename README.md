# Team Collaboration Platform - Backend

A real-time team collaboration backend built with Node.js, Express, MongoDB, and Socket.io.

## Overview

This backend service provides APIs for a team collaboration platform that enables real-time communication, project management, task tracking, and team coordination. It uses WebSockets for instant updates across all connected clients.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Real-time Communication**: Socket.io integration for instant messaging and updates
- **Project Management**: Create and manage collaborative projects
- **Task Management**: Assign and track tasks within projects
- **Team Management**: Organize users into teams with different roles
- **Messaging**: Real-time chat system for team communication
- **Security**: Helmet for HTTP headers, rate limiting, CORS protection, bcryptjs for password hashing
- **Validation**: Request validation using Joi

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: Joi
- **Development**: Nodemon

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas connection string)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd team-collaboration-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section)

## Environment Variables

Create a `.env` file in the root directory. See `.env.example` for reference:

| Variable           | Description                          | Example                                 |
| ------------------ | ------------------------------------ | --------------------------------------- |
| `PORT`             | Server port                          | `5000`                                  |
| `NODE_ENV`         | Environment (development/production) | `development`                           |
| `MONGODB_URI`      | MongoDB connection string            | `mongodb://localhost:27017/team-collab` |
| `JWT_SECRET`       | Secret key for JWT signing           | `your-secret-key-here`                  |
| `JWT_EXPIRE`       | JWT expiration time                  | `7d`                                    |
| `CORS_ORIGIN`      | Frontend URL for CORS                | `http://localhost:5173`                 |
| `FIREBASE_API_KEY` | Firebase API key (optional)          | `your-api-key`                          |

## Running the Server

### Development Mode

```bash
npm run dev
```

Runs the server with Nodemon for auto-reload on file changes. Server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

Starts the server normally on the configured PORT.

## Project Structure

```
src/
├── app.js              # Express app configuration
├── server.js           # Server initialization with Socket.io
├── config/
│   ├── constants.js    # Application constants
│   └── database.js     # MongoDB connection setup
├── controllers/        # Business logic for routes
│   ├── authController.js
│   ├── messageController.js
│   ├── projectController.js
│   ├── taskController.js
│   └── teamController.js
├── middleware/         # Custom middleware
│   ├── authMiddleware.js       # JWT verification
│   ├── errorHandler.js         # Error handling
│   ├── roleMiddleware.js       # Role-based access
│   └── validateRequest.js      # Request validation
├── models/            # MongoDB schemas
│   ├── User.js
│   ├── Team.js
│   ├── Project.js
│   ├── Task.js
│   └── Message.js
├── routes/            # API endpoints
│   ├── authRoutes.js
│   ├── messageRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   ├── teamRoutes.js
│   └── index.js
├── utils/             # Utility functions
│   ├── errorTypes.js
│   └── responseHandler.js
└── validators/        # Input validation schemas
    ├── authValidator.js
    ├── messageValidator.js
    ├── projectValidator.js
    ├── taskValidator.js
    └── teamValidator.js
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Teams

- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Messages

- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

## WebSocket Events

The Socket.io server handles real-time updates with the following events:

- `connect` - User connected
- `message:send` - New message received
- `task:update` - Task updated
- `project:update` - Project updated
- `user:online` - User online status
- `disconnect` - User disconnected

## Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Restricted to configured origins only
- **Rate Limiting**: API endpoints limited to 100 requests per 15 minutes
- **JWT**: Token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Joi schemas for all request data

## Error Handling

The application uses a centralized error handler middleware that catches and formats all errors with:

- Error type classification
- HTTP status codes
- Descriptive error messages
- Request tracking

## Testing

```bash
npm test
```

## Deployment

### Using Environment Variables

Set all required environment variables in your hosting platform before deploying.

### MongoDB Atlas

For production, use MongoDB Atlas instead of local MongoDB:

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Set `MONGODB_URI` in `.env`

### Hosting Options

- Heroku
- AWS (EC2, Elastic Beanstalk)
- Railway
- DigitalOcean
- Azure App Service

## Troubleshooting

### Connection Issues

- Verify MongoDB is running and accessible
- Check `MONGODB_URI` in `.env`
- Ensure network allows MongoDB port (default: 27017)

### CORS Errors

- Update `CORS_ORIGIN` to match your frontend URL
- Check that frontend is running on the correct port

### Socket.io Connection Failed

- Verify backend server is running
- Check CORS configuration matches frontend origin
- Ensure WebSocket is not blocked by firewall

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.
