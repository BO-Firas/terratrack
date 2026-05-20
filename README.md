# PFE 2026 — Systeme de Tracking GPS des Agents Terrain

Application mobile et tableau de bord web pour le suivi GPS en temps reel d'agents commerciaux/medicaux, avec geofencing automatique, gestion des visites clients et generation de rapports.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Flutter App    │◄───────►│  Node.js + Express│◄───────►│  React Dashboard │
│  (Agent mobile) │  REST + │  REST API +      │  REST + │  (Superviseur/   │
│                 │ Socket.IO│  Socket.IO server│ Socket.IO│   Admin web)    │
└─────────────────┘         └────────┬─────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │     MongoDB       │
                            │  (index 2dsphere) │
                            └──────────────────┘
```

## Structure du projet

```
pfe-gps-tracking/
├── backend/          ✅ API Node.js + Express + Socket.IO + MongoDB
├── mobile/           🔜 Application Flutter (agent)
├── dashboard/        🔜 Tableau de bord React (superviseur/admin)
└── docs/             🔜 UML, specifications, rapport
```

## Phases de developpement

| Phase | Contenu | Etat |
|-------|---------|------|
| 1 | Fondations (backend + auth + modeles + scaffolding) | ✅ En cours |
| 2 | GPS temps reel (Flutter + Socket.IO + carte live) | 🔜 |
| 3 | Geofencing & visites (deja implemente cote backend) | ✅ Backend |
| 4 | Zones autorisees & alertes | ✅ Backend |
| 5 | Rapports & polish UI | 🔜 |

## Demarrage rapide

1. **Backend** : `cd backend && npm install && npm run seed && npm run dev`
2. **Dashboard** : (a venir) `cd dashboard && npm install && npm run dev`
3. **Mobile** : (a venir) `cd mobile && flutter pub get && flutter run`

Voir `backend/README.md` pour les details.

## Stack technique

- **Mobile** : Flutter / Dart, geolocator, flutter_map, socket_io_client
- **Backend** : Node.js, Express, Socket.IO, Mongoose
- **Base de donnees** : MongoDB avec index geospatiaux 2dsphere
- **Dashboard** : React, Leaflet (OpenStreetMap), socket.io-client
- **Authentification** : JWT
