import 'package:geolocator/geolocator.dart';
import '../models/client.dart';

/// Service de geofencing local
/// Detecte les entrees/sorties dans les zones clients EN LOCAL,
/// permet une reactivite immediate dans l'UI sans attendre le backend.
///
/// Le backend fait aussi sa propre detection (source de verite),
/// mais le local permet d'afficher l'indicateur de visite instantanement.
class LocalGeofencingService {
  /// Clients dont on surveille la position
  List<Client> _watchedClients = [];

  /// IDs des clients actuellement "occupes" (= agent est dans leur geofence)
  final Set<String> _activeGeofences = {};

  void Function(Client client)? onEnterGeofence;
  void Function(Client client)? onExitGeofence;

  /// Definir la liste des clients a surveiller
  void setClients(List<Client> clients) {
    _watchedClients = clients;
  }

  /// A appeler a chaque nouvelle position GPS recue
  /// Compare la position aux geofences et declenche les callbacks
  void check(Position position) {
    final currentInside = <String>{};

    for (final client in _watchedClients) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        client.latitude,
        client.longitude,
      );

      if (distance <= client.geofenceRadius) {
        currentInside.add(client.id);

        // Entree detectee
        if (!_activeGeofences.contains(client.id)) {
          _activeGeofences.add(client.id);
          onEnterGeofence?.call(client);
        }
      }
    }

    // Sorties : clients qui etaient actifs mais ne le sont plus
    final exited = _activeGeofences.difference(currentInside).toList();
    for (final id in exited) {
      _activeGeofences.remove(id);
      final client = _watchedClients.firstWhere(
        (c) => c.id == id,
        orElse: () => Client(
          id: id,
          name: 'Client inconnu',
          type: 'other',
          longitude: 0,
          latitude: 0,
          geofenceRadius: 50,
        ),
      );
      onExitGeofence?.call(client);
    }
  }

  bool isInsideAny() => _activeGeofences.isNotEmpty;

  String? getCurrentClientId() =>
      _activeGeofences.isEmpty ? null : _activeGeofences.first;

  void reset() {
    _activeGeofences.clear();
  }
}
