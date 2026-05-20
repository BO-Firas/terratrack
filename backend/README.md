# Backend - PFE GPS Tracking

API REST + WebSocket pour le systeme de suivi GPS des agents terrain.

## Stack
- Node.js 18+
- Express 4
- MongoDB 6+ (avec index 2dsphere pour les requetes geospatiales)
- Socket.IO 4 (temps reel)
- JWT pour l'authentification

## Installation

```bash
cd backend
npm install
cp .env.example .env
# Editer .env si necessaire (MONGODB_URI, JWT_SECRET, etc.)
```

## Demarrer MongoDB

```bash
# Si MongoDB est installe en local
mongod

# Ou avec Docker
docker run -d -p 27017:27017 --name mongo mongo:6
```

## Peupler la base de donnees (donnees de test)

```bash
npm run seed
```

Cree 4 comptes de test :
- `admin@pfe.tn` / `admin123`
- `supervisor@pfe.tn` / `super123`
- `agent1@pfe.tn` / `agent123` (zone : Grand Tunis)
- `agent2@pfe.tn` / `agent123` (zone : Ariana)

Cree aussi 4 clients (pharmacies, hopital, cabinet) localises a Tunis.

## Lancer le serveur

```bash
# Developpement (avec hot reload)
npm run dev

# Production
npm start
```

L'API ecoute sur `http://localhost:5000` par defaut.

## Endpoints principaux

### Authentification
- `POST /api/auth/login` - connexion
- `POST /api/auth/register` - inscription
- `GET /api/auth/me` - utilisateur courant

### Agents (superviseur/admin)
- `GET /api/agents` - liste des agents
- `GET /api/agents/live` - positions temps reel
- `GET /api/agents/:id/track?date=YYYY-MM-DD` - trajet du jour

### Clients
- `GET /api/clients` - liste
- `GET /api/clients/near?lng=...&lat=...` - clients proches
- `POST /api/clients` - creation (admin/supervisor)

### Zones
- `GET /api/zones` - liste
- `GET /api/zones/contains?lng=...&lat=...` - zones contenant un point

### Visites
- `GET /api/visits` - liste filtrable
- `GET /api/visits/today` - visites du jour (agent)

### Alertes
- `GET /api/alerts` - liste
- `PUT /api/alerts/:id/resolve` - marquer comme resolue

## Socket.IO

Authentification via JWT dans `auth.token` lors de la connexion.

**Client (agent) -> Serveur:**
- `location:update` { longitude, latitude, accuracy, speed, batteryLevel }

**Serveur -> Client (agent):**
- `visit:entered` { visit }
- `visit:exited` { visit }
- `alert:zone` { alert }

**Serveur -> Superviseurs (room 'supervisors'):**
- `agent:location` { agentId, longitude, latitude, ... }
- `agent:visit` { agentId, visit, action }
- `agent:alert` { alert }
