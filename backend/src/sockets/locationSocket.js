const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LocationPing = require('../models/LocationPing');
const { processGeofencing, checkAuthorizedZone } = require('../utils/geofencing');

/**
 * Configure les handlers Socket.IO
 *
 * Evenements emis par le client (agent):
 *   - 'location:update' { longitude, latitude, accuracy, speed, ... }
 *
 * Evenements emis vers le client:
 *   - 'visit:entered' { visit }     -> entree dans le geofence d'un client
 *   - 'visit:exited' { visit }      -> sortie du geofence
 *   - 'alert:zone'                  -> sortie de zone autorisee
 *
 * Evenements emis vers les superviseurs (room 'supervisors'):
 *   - 'agent:location' { agentId, longitude, latitude, ... }
 *   - 'agent:visit' { agentId, visit, action: 'entered'|'exited' }
 *   - 'agent:alert' { alert }
 */
function setupSocketHandlers(io) {
  // Middleware d'authentification Socket.IO via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token manquant'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('assignedZones');
      if (!user || !user.isActive) return next(new Error('Utilisateur invalide'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentification echouee'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] ${user.fullName} (${user.role}) connecte - ${socket.id}`);

    // Les superviseurs/admins rejoignent une room dediee
    if (user.role === 'supervisor' || user.role === 'admin') {
      socket.join('supervisors');
    } else if (user.role === 'agent') {
      socket.join(`agent:${user._id}`);
    }

    // ========== Reception des positions GPS d'un agent ==========
    socket.on('location:update', async (data) => {
      try {
        if (user.role !== 'agent') return;

        const { longitude, latitude, accuracy, speed, heading, altitude, batteryLevel } = data;
        if (typeof longitude !== 'number' || typeof latitude !== 'number') {
          return socket.emit('error', { message: 'Coordonnees invalides' });
        }

        const coordinates = [longitude, latitude];

        // 1. Sauvegarder le ping
        const ping = await LocationPing.create({
          agent: user._id,
          location: { type: 'Point', coordinates },
          accuracy,
          speed,
          heading,
          altitude,
          batteryLevel,
          timestamp: new Date(),
        });

        // 2. Mettre a jour la derniere position connue
        await User.findByIdAndUpdate(user._id, {
          lastKnownLocation: {
            type: 'Point',
            coordinates,
            updatedAt: new Date(),
          },
        });

        // 3. Diffuser aux superviseurs en temps reel
        io.to('supervisors').emit('agent:location', {
          agentId: user._id,
          agentName: user.fullName,
          longitude,
          latitude,
          accuracy,
          speed,
          timestamp: ping.timestamp,
        });

        // 4. Geofencing - detection entree/sortie de clients
        const geofenceResult = await processGeofencing(user._id, coordinates);

        for (const visit of geofenceResult.entered) {
          const populated = await visit.populate('client', 'name type');
          socket.emit('visit:entered', { visit: populated });
          io.to('supervisors').emit('agent:visit', {
            agentId: user._id,
            visit: populated,
            action: 'entered',
          });
        }

        for (const visit of geofenceResult.exited) {
          const populated = await visit.populate('client', 'name type');
          socket.emit('visit:exited', { visit: populated });
          io.to('supervisors').emit('agent:visit', {
            agentId: user._id,
            visit: populated,
            action: 'exited',
          });
        }

        // 4bis. Chevauchement de geofences -> demander a l'agent de choisir
        if (geofenceResult.needsSelection) {
          socket.emit('visit:selection_needed', geofenceResult.needsSelection);
        }

        // 5. Verification de la zone autorisee
        const zoneCheck = await checkAuthorizedZone(user, coordinates);
        if (!zoneCheck.inAuthorizedZone && zoneCheck.alert) {
          socket.emit('alert:zone', { alert: zoneCheck.alert });
          io.to('supervisors').emit('agent:alert', { alert: zoneCheck.alert });
        }
      } catch (error) {
        console.error('[Socket] location:update error:', error);
        socket.emit('error', { message: 'Erreur lors du traitement de la position' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.fullName} deconnecte`);
    });
  });
}

module.exports = setupSocketHandlers;
