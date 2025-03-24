# Top Chef Fantasy Application

A full-stack application for Top Chef fans to create and join fantasy leagues, draft chefs, track performance, and compete with friends.

## Technologies Used

### Frontend
- Vite 6.2.2 with React 19.0.10
- TailwindCSS for styling
- React Router for navigation
- Socket.io client for real-time updates

### Backend
- Express.js
- MongoDB Atlas for database
- Socket.io for real-time communication
- JWT authentication

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

1. Clone the repository
\\\ash
git clone https://github.com/yourusername/top-chef-fantasy.git
cd top-chef-fantasy
\\\

2. Install dependencies for both frontend and backend
\\\ash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
\\\

3. Set up environment variables
- Create a .env file in the server directory based on .env.example
- Create a .env file in the client directory based on .env.example

4. Start the development servers
\\\ash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd ../client
npm run dev
\\\

5. Access the application at http://localhost:5173

## Deployment

The application is set up for deployment on Render.com using the provided render.yaml file.

## Project Structure

- /client - Frontend React application
- /server - Backend Express application
  - /src/models - MongoDB schemas
  - /src/controllers - API controllers
  - /src/routes - API routes
  - /src/middleware - Express middleware
  - /src/socket - Socket.io implementation
