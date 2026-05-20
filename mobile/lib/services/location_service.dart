import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart' as ph;
import '../config.dart';

/// Service GPS - obtient la position de l'appareil en continu
/// Gere les permissions et le stream de positions
class LocationService {
  StreamSubscription<Position>? _positionSub;
  final _positionController = StreamController<Position>.broadcast();

  /// Stream public de positions GPS - tout le monde peut s'y abonner
  Stream<Position> get positionStream => _positionController.stream;

  Position? _lastPosition;
  Position? get lastPosition => _lastPosition;

  /// Demande les permissions de localisation
  /// Retourne true si toutes les permissions necessaires sont accordees
  Future<bool> requestPermissions() async {
    // 1. Verifier que le service de localisation est active
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Demander a l'utilisateur d'activer le GPS
      serviceEnabled = await Geolocator.openLocationSettings();
      if (!serviceEnabled) return false;
    }

    // 2. Permission au premier plan
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return false;
    }

    if (permission == LocationPermission.deniedForever) {
      // L'utilisateur a refuse pour toujours - on ne peut rien faire
      return false;
    }

    return true;
  }

  /// Demande la permission de localisation en arriere-plan
  /// A appeler APRES requestPermissions() qui doit retourner true
  Future<bool> requestBackgroundPermission() async {
    final status = await ph.Permission.locationAlways.request();
    return status.isGranted;
  }

  /// Obtient la position actuelle (one-shot)
  Future<Position> getCurrentPosition() async {
    final pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      ),
    );
    _lastPosition = pos;
    return pos;
  }

  /// Demarre le suivi continu - emet une nouvelle position regulierement
  Future<void> startTracking() async {
    if (_positionSub != null) return; // deja actif

    final settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: AppConfig.minDistanceMeters.toInt(),
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: settings).listen(
      (Position pos) {
        _lastPosition = pos;
        _positionController.add(pos);
      },
      onError: (err) {
        // ignore: avoid_print
        print('[LocationService] Erreur GPS: $err');
      },
    );
  }

  void stopTracking() {
    _positionSub?.cancel();
    _positionSub = null;
  }

  void dispose() {
    stopTracking();
    _positionController.close();
  }
}
