/**
 * TerraTrack - Simulateur d'agent terrain
 *
 * Simule un agent qui se deplace dans Gabes, visite ses clients,
 * et envoie ses positions GPS au backend via Socket.IO.
 *
 * Usage:
 *   node simulator.js                          # agent par defaut
 *   node simulator.js agent2@terratrack.tn     # autre agent
 */

const { io } = require('socket.io-client');
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const EMAIL = process.argv[2] || 'agent1@terratrack.tn';
const PASSWORD = 'agent123';

// Itineraire dans Gabes - visite les clients de la zone Gabes Centre
const itinerary = [
  // Depart - Avenue Farhat Hached
  { lng: 10.0980, lat: 33.8881, label: '🚀 Depart - Avenue Farhat Hached' },
  { lng: 10.0981, lat: 33.8881 },
  { lng: 10.0982, lat: 33.8881, label: '→ Pharmacie Centrale Gabes' },

  // === Visite #1 : Pharmacie Centrale Gabes (radius 40m) ===
  { lng: 10.0982, lat: 33.8881, label: '🏥 ENTREE Pharmacie Centrale' },
  { lng: 10.0983, lat: 33.8882 },
  { lng: 10.0981, lat: 33.8880 },
  { lng: 10.0982, lat: 33.8881 },
  { lng: 10.0984, lat: 33.8881 },
  { lng: 10.0980, lat: 33.8882 },
  { lng: 10.0982, lat: 33.8880 },
  { lng: 10.0983, lat: 33.8883 },
  { lng: 10.0981, lat: 33.8881 },
  { lng: 10.0982, lat: 33.8882 },
  { lng: 10.0982, lat: 33.8881 },
  { lng: 10.0983, lat: 33.8881, label: '🚶 Sortie Pharmacie' },

  // === Trajet vers Hopital Universitaire (10.1015, 33.8920) ===
  { lng: 10.0990, lat: 33.8890, label: '🚗 En route vers Hopital' },
  { lng: 10.0998, lat: 33.8900 },
  { lng: 10.1005, lat: 33.8910 },
  { lng: 10.1012, lat: 33.8917 },

  // === Visite #2 : Hopital Universitaire (radius 80m) ===
  { lng: 10.1015, lat: 33.8920, label: '🏥 ENTREE Hopital Universitaire' },
  { lng: 10.1016, lat: 33.8921 },
  { lng: 10.1014, lat: 33.8919 },
  { lng: 10.1015, lat: 33.8922 },
  { lng: 10.1017, lat: 33.8920 },
  { lng: 10.1013, lat: 33.8920 },
  { lng: 10.1015, lat: 33.8918 },
  { lng: 10.1016, lat: 33.8921 },
  { lng: 10.1015, lat: 33.8920 },
  { lng: 10.1014, lat: 33.8921 },
  { lng: 10.1015, lat: 33.8920, label: '🚶 Sortie Hopital' },

  // === Trajet vers Pharmacie El Amen (10.0950, 33.8895) ===
  { lng: 10.1000, lat: 33.8910, label: '🚗 En route vers Pharmacie El Amen' },
  { lng: 10.0985, lat: 33.8903 },
  { lng: 10.0970, lat: 33.8898 },
  { lng: 10.0955, lat: 33.8896 },

  // === Visite #3 : Pharmacie El Amen (radius 35m) ===
  { lng: 10.0950, lat: 33.8895, label: '🏥 ENTREE Pharmacie El Amen' },
  { lng: 10.0951, lat: 33.8896 },
  { lng: 10.0949, lat: 33.8894 },
  { lng: 10.0950, lat: 33.8895 },
  { lng: 10.0951, lat: 33.8895 },
  { lng: 10.0950, lat: 33.8896 },
  { lng: 10.0950, lat: 33.8895, label: '🚶 Sortie Pharmacie El Amen' },

  // === Trajet vers Cabinet Dr. Mansouri ===
  { lng: 10.0970, lat: 33.8885, label: '🚗 En route vers Cabinet' },
  { lng: 10.0985, lat: 33.8875 },
  { lng: 10.0995, lat: 33.8870 },

  // === Visite #4 : Cabinet Dr. Mansouri (radius 30m) ===
  { lng: 10.1000, lat: 33.8865, label: '🏥 ENTREE Cabinet Dr. Mansouri' },
  { lng: 10.1001, lat: 33.8866 },
  { lng: 10.0999, lat: 33.8864 },
  { lng: 10.1000, lat: 33.8865 },
  { lng: 10.1001, lat: 33.8865 },
  { lng: 10.1000, lat: 33.8866 },
  { lng: 10.1000, lat: 33.8865, label: '🚶 Sortie Cabinet' },

  // Retour vers le centre
  { lng: 10.0990, lat: 33.8875, label: '🚗 Retour vers le centre' },
  { lng: 10.0980, lat: 33.8881 },
];

async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  TerraTrack - Simulateur agent terrain    ║');
  console.log('║  Lieu : Gabes, Tunisie                     ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`Agent : ${EMAIL}\n`);

  console.log('🔐 Connexion...');
  let token;
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    token = res.data.token;
    console.log(`✅ Connecte en tant que ${res.data.user.fullName}`);
  } catch (err) {
    console.error('❌ Echec de la connexion:', err.response?.data?.message || err.message);
    console.error('   Verifie que le backend tourne sur', BACKEND_URL);
    console.error('   Verifie aussi que tu as fait : npm run seed');
    process.exit(1);
  }

  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log(`✅ Socket.IO connecte (${socket.id})`);
    console.log('🚀 Demarrage de la simulation - 1 position / 2s\n');
    console.log('   (Ctrl+C pour arreter)\n');
    startSimulation();
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Erreur Socket.IO:', err.message);
    process.exit(1);
  });

  socket.on('visit:entered', (data) => {
    console.log(`   📥 Visite demarree chez : ${data.visit.client.name}`);
  });

  socket.on('visit:exited', (data) => {
    const duration = data.visit.durationSeconds;
    console.log(`   📤 Visite terminee chez ${data.visit.client.name} (${duration}s)`);
  });

  socket.on('alert:zone', (data) => {
    console.log(`   ⚠️  ALERTE: ${data.alert.message}`);
  });

  let step = 0;
  function startSimulation() {
    setInterval(() => {
      const point = itinerary[step % itinerary.length];

      if (point.label) {
        console.log(`📍 [${(step + 1).toString().padStart(2, '0')}/${itinerary.length}] ${point.label}`);
      } else {
        process.stdout.write('.');
      }

      socket.emit('location:update', {
        longitude: point.lng,
        latitude: point.lat,
        accuracy: 5 + Math.random() * 10,
        speed: Math.random() * 2,
        batteryLevel: Math.max(20, 100 - Math.floor(step / 5)),
      });

      step++;
      if (step === itinerary.length) {
        console.log('\n\n🔁 Itineraire termine - on recommence...\n');
      }
    }, 2000);
  }
}

main().catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
