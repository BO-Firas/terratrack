# Mobile - PFE GPS Tracking

Application Flutter pour les agents terrain.

## Stack
- Flutter 3.x / Dart
- Provider (state management)
- Geolocator (GPS)
- google_maps_flutter
- socket_io_client
- dio (HTTP)
- flutter_secure_storage (JWT)

## Configuration

L'app est configuree pour fonctionner avec **l'emulateur Android**. Sur l'emulateur,
l'adresse IP de la machine hote est `10.0.2.2`.

Si tu utilises un vrai appareil Android sur le meme reseau Wi-Fi que le PC,
remplace les URLs dans `lib/config.dart` par l'IP locale de ton PC (ex: `192.168.1.10`).

```dart
static const String apiBaseUrl = 'http://10.0.2.2:5000/api';
static const String socketUrl = 'http://10.0.2.2:5000';
```

## Installation

⚠️ Plusieurs etapes a faire avant `flutter run`. Suis les dans l'ordre.

### 1. Creer le projet Flutter complet
Le contenu fourni est juste le code source. Il faut creer un projet Flutter
complet par-dessus pour avoir tous les fichiers Android/iOS necessaires :

```bash
# Depuis le dossier parent
cd pfe-gps-tracking
flutter create --org com.pfe --project-name pfe_gps_mobile mobile
```

Cela cree les fichiers manquants (android/, ios/, etc.) **sans ecraser** ce qu'on a deja
dans `lib/`. Si Flutter te demande de remplacer des fichiers, refuse pour `lib/main.dart`,
`pubspec.yaml`, et `AndroidManifest.xml` (notre version a la cle Google Maps).

### 2. Installer les dependances

```bash
cd mobile
flutter pub get
```

### 3. Mettre a jour AndroidManifest.xml et permissions

Le fichier `android/app/src/main/AndroidManifest.xml` est deja configure avec :
- Toutes les permissions GPS (incluant background)
- La cle API Google Maps

Verifier aussi `android/app/build.gradle` :
- `minSdkVersion 21` (ou plus eleve)

### 4. Lancer l'emulateur Android

Dans Android Studio :
- Tools → Device Manager → Create Device (Pixel 6 ou similaire)
- Image systeme : API 33 ou 34 avec Google Play services
- Demarrer l'emulateur

### 5. Activer le faux GPS dans l'emulateur

L'emulateur n'a pas de vrai GPS. Pour simuler une position :
- Sur le panneau de l'emulateur (3 points "..." en bas a droite)
- Onglet **Location**
- Entrer lat / lng (par ex. `36.8065` / `10.1815` pour Tunis)
- Cliquer **Set Location**

### 6. Lancer l'app

```bash
flutter run
```

## Comptes de test

- `agent1@pfe.tn` / `agent123` (zone Grand Tunis)
- `agent2@pfe.tn` / `agent123` (zone Ariana)

## Pages

| Page | Description |
|------|-------------|
| Login | Connexion JWT |
| Accueil | Stats du jour, visite en cours, GPS info |
| Carte | Position + clients + geofences |
| Visites | Historique des visites du jour |

## Fonctionnement du tracking

Au lancement de l'app (apres login) :
1. Demande des permissions GPS
2. Chargement de la liste des clients
3. Connexion Socket.IO au backend (avec JWT)
4. Demarrage du stream GPS

A chaque nouvelle position GPS (environ toutes les ~5m de deplacement) :
1. Envoi de la position au backend via Socket.IO
2. Verification locale du geofencing (UI reactive immediate)
3. Le backend confirme/declenche les visites

## Test du parcours complet

1. Backend tournant (`localhost:5000`)
2. Dashboard tournant (`localhost:5173`) - login superviseur
3. App Flutter sur emulateur - login agent
4. Dans l'emulateur, changer la position GPS :
   - **36.8065 / 10.1815** → centre de Tunis (proche Pharmacie Centrale)
   - L'app devrait detecter l'entree dans le geofence
   - Le dashboard devrait afficher la visite en temps reel
   - Bouger ensuite vers **36.8100 / 10.1700** → Hopital Charles Nicolle
   - La visite precedente se termine, une nouvelle commence

## Problemes connus

- **GPS background** : limite sur l'emulateur, fonctionne bien sur vrai appareil
- **Google Maps tile error** : verifier que la cle API est correcte dans `AndroidManifest.xml`
  ET dans `lib/config.dart`
- **Connexion refusee** : verifier que le backend tourne et que `10.0.2.2` est bien
  l'adresse utilisee (pas `localhost`)
