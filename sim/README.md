# Simulateur d'agent terrain

Petit script Node.js qui simule un agent qui se deplace dans Tunis,
visite ses 3 clients, et envoie ses positions GPS au backend en temps reel.

Utile pour tester le tableau de bord superviseur sans avoir besoin de l'app Flutter.

## Installation

```bash
cd simulator
npm install
```

## Utilisation

Assure-toi que le backend tourne (`http://localhost:5000`).

```bash
# Lance l'agent par defaut (Ahmed Ben Salah)
npm start

# Ou un agent specifique
npm run agent1   # Ahmed Ben Salah (zone Grand Tunis)
npm run agent2   # Sami Khelifi  (zone Ariana)
```

## Ce que tu vas voir

**Dans le terminal du simulateur :**
```
🤖 Simulateur d'agent - agent1@pfe.tn
🔐 Connexion...
✅ Connecte en tant que Ahmed Ben Salah
✅ Socket.IO connecte
🚀 Demarrage de la simulation
📍 [1/47] Depart - Centre Tunis
📍 [4/47] 🏥 ENTREE Pharmacie Centrale
   📥 Visite demarree chez : Pharmacie Centrale
...
```

**Dans le dashboard (http://localhost:5173) :**
- Le marqueur bleu de l'agent apparait sur la carte
- Il se deplace en temps reel toutes les 2 secondes
- Quand il entre dans un geofence client : nouvelle visite dans le panneau de droite
- Quand il sort : la visite est terminee avec sa duree
- Si l'agent passe dans une zone non autorisee : alerte rouge

## Itineraire simule

L'agent fait un tour complet :
1. Centre de Tunis (depart)
2. Pharmacie Centrale (visite ~30 sec)
3. Hopital Charles Nicolle (visite ~20 sec)
4. Cabinet Dr. Mejri (visite ~14 sec)
5. Retour centre

Puis recommence en boucle.

Ctrl+C pour arreter.
