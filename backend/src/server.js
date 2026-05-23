require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const setupSocketHandlers = require('./sockets/locationSocket');
const reportRoutes = require('./routes/reportRoutes');
const { startScheduledJobs } = require('./jobs/inactivityJob');

// Routes
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const visitRoutes = require('./routes/visitRoutes');
const alertRoutes = require('./routes/alertRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const server = http.createServer(app);

// Configuration CORS - accepter les origines listees dans .env
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim());
const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser requetes sans origin (Postman, app mobile native)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS bloque'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Error handler global - DOIT etre le dernier middleware
app.use(errorHandler);

// Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});
setupSocketHandlers(io);
startScheduledJobs(io);

// Demarrage
const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] API en ecoute sur le port ${PORT}`);
    console.log(`[Server] Socket.IO actif`);
  });
})();

// Gestion propre de l'arret
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM recu, arret en cours...');
  server.close(() => process.exit(0));
});
