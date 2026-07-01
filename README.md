# Police CAD/MDT System

A comprehensive Computer-Aided Dispatch (CAD) and Mobile Data Terminal (MDT) system for law enforcement roleplay.

## Features

### Dispatcher (CAD)
- Create and manage emergency calls
- Assign units to calls in real-time
- View unit status and locations
- Track active calls
- Add notes to calls

### Officer (MDT)
- View assigned calls
- View all active calls
- Search citizen database
- Search vehicle database
- Update unit status
- Real-time notifications

### Database
- Citizen records with warrants and arrest history
- Vehicle database with registration and flags
- Call history and logs
- Unit tracking

## Installation

### Prerequisites
- Node.js 14+
- MongoDB (local or Atlas)

### Setup

1. Clone the repository
```bash
git clone https://github.com/REHEHEHEH333/ERLC-CAD-TESTING.git
cd ERLC-CAD-TESTING
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI and JWT secret
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/police-cad
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

5. Start MongoDB
```bash
# If using local MongoDB
mongod
```

6. Start the server
```bash
npm start
```

7. Access the application
- Open `http://localhost:5000` in your browser

## Development

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Calls
- `GET /api/calls` - Get all calls
- `POST /api/calls` - Create new call
- `GET /api/calls/:id` - Get call details
- `PUT /api/calls/:id` - Update call
- `POST /api/calls/:id/close` - Close call
- `POST /api/calls/:callId/assign-unit` - Assign unit to call

### Units
- `GET /api/units` - Get all units
- `POST /api/units` - Create unit
- `PUT /api/units/:id/status` - Update unit status
- `PUT /api/units/:id/location` - Update unit location

### Citizens
- `GET /api/citizens` - Get all citizens
- `GET /api/citizens/search` - Search citizens
- `POST /api/citizens` - Create citizen
- `POST /api/citizens/:id/warrants` - Add warrant
- `POST /api/citizens/:id/arrests` - Add arrest record

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/search` - Search vehicles
- `POST /api/vehicles` - Create vehicle
- `POST /api/vehicles/:id/flags` - Add vehicle flag

## Real-time Features

Utilizes Socket.IO for real-time updates:
- Call creation and updates
- Unit status changes
- Location tracking
- Live notifications

## Project Structure

```
.
├── models/           # MongoDB schemas
├── routes/           # API routes
├── middleware/       # Authentication and middleware
├── public/           # Frontend files
├── server.js         # Main server file
├── package.json      # Dependencies
└── README.md         # This file
```

## License

ISC
