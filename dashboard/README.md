# Dashboard - PFE GPS Tracking

Tableau de bord web pour les superviseurs et administrateurs.

## Stack
- React 18 + Vite
- React Router 6
- Tailwind CSS 3
- Leaflet + React-Leaflet (cartes OpenStreetMap)
- Socket.IO client (temps reel)
- Axios (API REST)

## Installation

```bash
cd dashboard
npm install
```

## Lancer en mode developpement

```bash
npm run dev
```

L'app sera accessible sur `http://localhost:5173`.

**Prerequis** : le backend doit etre lance sur `http://localhost:5000`.

## Comptes de test

Apres avoir execute `npm run seed` cote backend :
- `admin@pfe.tn` / `admin123`
- `supervisor@pfe.tn` / `super123`

Les agents (`agent1@pfe.tn`, `agent2@pfe.tn`) n'ont pas acces au dashboard.

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Authentification JWT |
| `/map` | Carte live - positions des agents en temps reel |
| `/agents` | Liste et profils des agents |
| `/clients` | Liste des clients avec geofences |
| `/zones` | Zones geographiques autorisees |
| `/visits` | Historique des visites avec filtre par date |
| `/alerts` | Alertes en temps reel |

## Configuration

Le fichier `.env` permet de modifier les URLs :
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Build production

```bash
npm run build
```

Genere les fichiers statiques dans `dist/`.
