require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Attach io to requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB error:', err));

// Routes
const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const unitRoutes = require('./routes/units');
const citizenRoutes = require('./routes/citizens');
const vehicleRoutes = require('./routes/vehicles');
const authenticateToken = require('./middleware/auth');

// Auth Routes (no auth needed)
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);

// Call Routes (with auth)
app.post('/api/calls', authenticateToken, callRoutes.createCall);
app.get('/api/calls', authenticateToken, callRoutes.getCalls);
app.get('/api/calls/:id', authenticateToken, callRoutes.getCall);
app.put('/api/calls/:id', authenticateToken, callRoutes.updateCall);
app.post('/api/calls/:callId/assign-unit', authenticateToken, callRoutes.assignUnit);
app.post('/api/calls/:callId/unassign-unit', authenticateToken, callRoutes.unassignUnit);
app.post('/api/calls/:id/notes', authenticateToken, callRoutes.addNote);
app.post('/api/calls/:id/close', authenticateToken, callRoutes.closeCall);

// Unit Routes (with auth)
app.get('/api/units', authenticateToken, unitRoutes.getUnits);
app.get('/api/units/:id', authenticateToken, unitRoutes.getUnit);
app.post('/api/units', authenticateToken, unitRoutes.createUnit);
app.put('/api/units/:id/status', authenticateToken, unitRoutes.updateUnitStatus);
app.put('/api/units/:id/location', authenticateToken, unitRoutes.updateUnitLocation);

// Citizen Routes (with auth)
app.get('/api/citizens', authenticateToken, citizenRoutes.getCitizens);
app.get('/api/citizens/search', authenticateToken, citizenRoutes.searchCitizens);
app.get('/api/citizens/:id', authenticateToken, citizenRoutes.getCitizen);
app.post('/api/citizens', authenticateToken, citizenRoutes.createCitizen);
app.post('/api/citizens/:id/warrants', authenticateToken, citizenRoutes.addWarrant);
app.post('/api/citizens/:id/arrests', authenticateToken, citizenRoutes.addArrestRecord);

// Vehicle Routes (with auth)
app.get('/api/vehicles', authenticateToken, vehicleRoutes.getVehicles);
app.get('/api/vehicles/search', authenticateToken, vehicleRoutes.searchVehicles);
app.get('/api/vehicles/:id', authenticateToken, vehicleRoutes.getVehicle);
app.post('/api/vehicles', authenticateToken, vehicleRoutes.createVehicle);
app.post('/api/vehicles/:id/flags', authenticateToken, vehicleRoutes.addFlag);

// Socket.IO Events
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('officer:online', (data) => {
        socket.broadcast.emit('officer:status', {
            officerId: data.officerId,
            status: 'online',
            timestamp: new Date(),
        });
        console.log('Officer online:', data.officerId);
    });

    socket.on('officer:offline', (data) => {
        socket.broadcast.emit('officer:status', {
            officerId: data.officerId,
            status: 'offline',
            timestamp: new Date(),
        });
        console.log('Officer offline:', data.officerId);
    });

    socket.on('unit:location:update', (data) => {
        socket.broadcast.emit('unit:location', data);
    });

    socket.on('unit:status:update', (data) => {
        socket.broadcast.emit('unit:status', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
