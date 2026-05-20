require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Client = require('../models/Client');
const Zone = require('../models/Zone');

// =====================================================================
//  TerraTrack - Seed Gabes
//  Donnees de demonstration : agents, zones, clients reels de Gabes
//  Coordonnees GPS reelles autour de l'Avenue Farhat Hached
// =====================================================================

async function seed() {
  await connectDB();

  console.log('[Seed] Nettoyage des collections...');
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Zone.deleteMany({}),
  ]);

  // ============ ZONES ============
  console.log('[Seed] Creation des zones (Gabes)...');

  // Zone 1 : Gabes Centre - polygone autour de l'Avenue Farhat Hached
  // Coordonnees [longitude, latitude] - ordre GeoJSON
  const gabesCentre = await Zone.create({
    name: 'Gabes Centre',
    description: 'Centre-ville de Gabes - Avenue Farhat Hached et environs',
    type: 'city',
    color: '#3b82f6', // bleu
    area: {
      type: 'Polygon',
      coordinates: [[
        [10.0900, 33.8800], // sud-ouest
        [10.1150, 33.8800], // sud-est
        [10.1150, 33.9050], // nord-est
        [10.0900, 33.9050], // nord-ouest
        [10.0900, 33.8800], // fermeture (= 1er point)
      ]],
    },
  });

  // Zone 2 : Gabes Sud (Chenini, Ghannouch) - zone industrielle/peripherie
  const gabesSud = await Zone.create({
    name: 'Gabes Sud',
    description: 'Sud de Gabes - Chenini, secteurs medicaux peripheriques',
    type: 'sector',
    color: '#10b981', // vert
    area: {
      type: 'Polygon',
      coordinates: [[
        [10.0850, 33.8550],
        [10.1200, 33.8550],
        [10.1200, 33.8800],
        [10.0850, 33.8800],
        [10.0850, 33.8550],
      ]],
    },
  });

  // ============ UTILISATEURS ============
  console.log('[Seed] Creation des utilisateurs...');

  await User.create({
    fullName: 'Admin TerraTrack',
    email: 'admin@terratrack.tn',
    password: 'admin123',
    role: 'admin',
    phone: '+216 75 270 000',
  });

  await User.create({
    fullName: 'Manel Trabelsi',
    email: 'supervisor@terratrack.tn',
    password: 'super123',
    role: 'supervisor',
    phone: '+216 75 270 111',
  });

  await User.create({
    fullName: 'Ahmed Ben Othmen',
    email: 'agent1@terratrack.tn',
    password: 'agent123',
    role: 'agent',
    phone: '+216 22 333 444',
    assignedZones: [gabesCentre._id],
  });

  await User.create({
    fullName: 'Sami Khelifi',
    email: 'agent2@terratrack.tn',
    password: 'agent123',
    role: 'agent',
    phone: '+216 22 555 666',
    assignedZones: [gabesSud._id],
  });

  // ============ CLIENTS ============
  // Coordonnees reelles autour de l'Avenue Farhat Hached a Gabes
  console.log('[Seed] Creation des clients...');

  await Client.create([
    {
      name: 'Pharmacie Centrale Gabes',
      type: 'pharmacy',
      address: 'Avenue Farhat Hached, Gabes Centre',
      phone: '+216 75 270 001',
      contactPerson: 'Dr. Karim Trabelsi',
      location: { type: 'Point', coordinates: [10.0982, 33.8881] },
      geofenceRadius: 40,
      zone: gabesCentre._id,
      expectedVisitDuration: { min: 10, max: 45 },
    },
    {
      name: 'Hopital Universitaire de Gabes',
      type: 'hospital',
      address: 'Rue Mongi Slim, Gabes',
      phone: '+216 75 271 100',
      contactPerson: 'Service Pharmacie',
      location: { type: 'Point', coordinates: [10.1015, 33.8920] },
      geofenceRadius: 80,
      zone: gabesCentre._id,
      expectedVisitDuration: { min: 15, max: 90 },
    },
    {
      name: 'Pharmacie El Amen',
      type: 'pharmacy',
      address: 'Avenue Habib Bourguiba, Gabes',
      phone: '+216 75 272 002',
      contactPerson: 'Dr. Salma Mejri',
      location: { type: 'Point', coordinates: [10.0950, 33.8895] },
      geofenceRadius: 35,
      zone: gabesCentre._id,
      expectedVisitDuration: { min: 8, max: 30 },
    },
    {
      name: 'Cabinet Dr. Mansouri',
      type: 'doctor',
      address: 'Rue Ibn Khaldoun, Gabes',
      phone: '+216 75 273 003',
      contactPerson: 'Dr. Fatma Mansouri',
      location: { type: 'Point', coordinates: [10.1000, 33.8865] },
      geofenceRadius: 30,
      zone: gabesCentre._id,
      expectedVisitDuration: { min: 15, max: 60 },
    },
    {
      name: 'Clinique Ibn Sina',
      type: 'hospital',
      address: 'Route de Medenine, Gabes',
      phone: '+216 75 274 004',
      location: { type: 'Point', coordinates: [10.1080, 33.8850] },
      geofenceRadius: 60,
      zone: gabesCentre._id,
      expectedVisitDuration: { min: 20, max: 75 },
    },
    {
      name: 'Pharmacie Chenini',
      type: 'pharmacy',
      address: 'Chenini, Gabes Sud',
      phone: '+216 75 275 005',
      location: { type: 'Point', coordinates: [10.1050, 33.8680] },
      geofenceRadius: 40,
      zone: gabesSud._id,
      expectedVisitDuration: { min: 8, max: 30 },
    },
  ]);

  console.log('\n[Seed] ✅ Termine !\n');
  console.log('═══════════════════════════════════════════');
  console.log(' TerraTrack - Comptes de demonstration');
  console.log('═══════════════════════════════════════════');
  console.log('  Admin       : admin@terratrack.tn       / admin123');
  console.log('  Superviseur : supervisor@terratrack.tn  / super123');
  console.log('  Agent 1     : agent1@terratrack.tn      / agent123  (Gabes Centre)');
  console.log('  Agent 2     : agent2@terratrack.tn      / agent123  (Gabes Sud)');
  console.log('═══════════════════════════════════════════');
  console.log(`  Zones : 2  |  Clients : 6  |  Lieu : Gabes, Tunisie`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Erreur:', err);
  process.exit(1);
});
