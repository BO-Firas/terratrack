import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config.dart';
import '../models/visit.dart';

/// Service Socket.IO - communication temps reel avec le backend
/// Envoie les positions GPS et recoit les evenements (visites, alertes)
class SocketService {
  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  // Callbacks publics que l'UI peut definir pour reagir aux evenements
  void Function(Visit visit)? onVisitEntered;
  void Function(Visit visit)? onVisitExited;
  void Function(Map<String, dynamic> alert)? onZoneAlert;

  /// Connexion au serveur Socket.IO avec authentification JWT
  void connect(String token) {
    if (_socket != null && _socket!.connected) return;

    _socket = IO.io(
      AppConfig.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      // ignore: avoid_print
      print('[Socket] Connecte: ${_socket!.id}');
    });

    _socket!.onDisconnect((_) {
      // ignore: avoid_print
      print('[Socket] Deconnecte');
    });

    _socket!.onConnectError((err) {
      // ignore: avoid_print
      print('[Socket] Erreur: $err');
    });

    // Visite demarree (entree dans un geofence)
    _socket!.on('visit:entered', (data) {
      if (data is Map && data['visit'] != null) {
        final visit = Visit.fromJson(Map<String, dynamic>.from(data['visit']));
        onVisitEntered?.call(visit);
      }
    });

    // Visite terminee (sortie du geofence)
    _socket!.on('visit:exited', (data) {
      if (data is Map && data['visit'] != null) {
        final visit = Visit.fromJson(Map<String, dynamic>.from(data['visit']));
        onVisitExited?.call(visit);
      }
    });

    // Alerte (ex: sortie de zone autorisee)
    _socket!.on('alert:zone', (data) {
      if (data is Map && data['alert'] != null) {
        onZoneAlert?.call(Map<String, dynamic>.from(data['alert']));
      }
    });

    _socket!.connect();
  }

  /// Envoyer une position GPS au backend
  /// Le backend va detecter automatiquement les entrees/sorties de geofence
  void sendLocation({
    required double longitude,
    required double latitude,
    double? accuracy,
    double? speed,
    double? heading,
    double? altitude,
    int? batteryLevel,
  }) {
    if (!isConnected) return;

    _socket!.emit('location:update', {
      'longitude': longitude,
      'latitude': latitude,
      'accuracy': accuracy,
      'speed': speed,
      'heading': heading,
      'altitude': altitude,
      'batteryLevel': batteryLevel,
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
