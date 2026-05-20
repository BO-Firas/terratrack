import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/client.dart';
import '../models/user.dart';
import '../models/visit.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/geofencing_service.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';

/// Provider central de l'application
/// Coordonne l'authentification, le GPS, Socket.IO et le geofencing local
class AppState extends ChangeNotifier {
  final AuthService authService;
  late final ApiService apiService;
  final LocationService locationService = LocationService();
  final SocketService socketService = SocketService();
  final LocalGeofencingService geofencingService = LocalGeofencingService();

  AppState({required this.authService}) {
    apiService = ApiService(authService);
    _setupCallbacks();
  }

  // ============ Etat public ============
  User? get currentUser => authService.currentUser;
  Position? get lastPosition => locationService.lastPosition;

  bool _isTracking = false;
  bool get isTracking => _isTracking;

  List<Client> _clients = [];
  List<Client> get clients => _clients;

  List<Visit> _todayVisits = [];
  List<Visit> get todayVisits => _todayVisits;

  Visit? _ongoingVisit;
  Visit? get ongoingVisit => _ongoingVisit;

  Client? _currentClient; // client dans le geofence duquel on est
  Client? get currentClient => _currentClient;

  String? _lastError;
  String? get lastError => _lastError;

  // ============ Callbacks Socket / GPS / Geofencing ============
  void _setupCallbacks() {
    // Recevoir les positions GPS et les transmettre + verifier geofences
    locationService.positionStream.listen(_handleNewPosition);

    // Socket.IO : confirmation backend des visites
    socketService.onVisitEntered = (visit) {
      _ongoingVisit = visit;
      _todayVisits.insert(0, visit);
      notifyListeners();
    };

    socketService.onVisitExited = (visit) {
      // Mettre a jour la visite terminee
      final idx = _todayVisits.indexWhere((v) => v.id == visit.id);
      if (idx >= 0) _todayVisits[idx] = visit;
      _ongoingVisit = null;
      notifyListeners();
    };

    socketService.onZoneAlert = (alert) {
      _lastError = alert['message']?.toString();
      notifyListeners();
    };

    // Geofencing local : reactivite immediate dans l'UI
    geofencingService.onEnterGeofence = (client) {
      _currentClient = client;
      notifyListeners();
    };

    geofencingService.onExitGeofence = (client) {
      if (_currentClient?.id == client.id) {
        _currentClient = null;
        notifyListeners();
      }
    };
  }

  // ============ Demarrage / arret du suivi ============

  /// Demarre le tracking GPS + connexion socket + chargement initial
  Future<bool> startTracking() async {
    final token = await authService.getToken();
    if (token == null) return false;

    // Permissions
    final granted = await locationService.requestPermissions();
    if (!granted) {
      _lastError = 'Permissions de localisation refusees';
      notifyListeners();
      return false;
    }

    // Charger les clients pour le geofencing local
    await loadClients();
    await loadTodayVisits();

    // Connecter Socket.IO
    socketService.connect(token);

    // Demarrer le suivi GPS
    await locationService.startTracking();
    _isTracking = true;

    notifyListeners();
    return true;
  }

  void stopTracking() {
    locationService.stopTracking();
    socketService.disconnect();
    _isTracking = false;
    _currentClient = null;
    geofencingService.reset();
    notifyListeners();
  }

  /// Appele a chaque nouvelle position GPS
  void _handleNewPosition(Position pos) {
    // 1. Envoyer au backend
    socketService.sendLocation(
      longitude: pos.longitude,
      latitude: pos.latitude,
      accuracy: pos.accuracy,
      speed: pos.speed,
      heading: pos.heading,
      altitude: pos.altitude,
    );

    // 2. Detection locale (reactivite UI immediate)
    geofencingService.check(pos);

    notifyListeners();
  }

  // ============ Chargement de donnees ============

  Future<void> loadClients() async {
    try {
      final res = await apiService.getClients();
      final list = (res.data['clients'] as List)
          .map((c) => Client.fromJson(c))
          .toList();
      _clients = list;
      geofencingService.setClients(list);
      notifyListeners();
    } catch (e) {
      _lastError = 'Erreur chargement clients: $e';
      notifyListeners();
    }
  }

  Future<void> loadTodayVisits() async {
    try {
      final res = await apiService.getTodayVisits();
      _todayVisits = (res.data['visits'] as List)
          .map((v) => Visit.fromJson(v))
          .toList();

      // Trouver la visite en cours s'il y en a une
      final ongoing = _todayVisits.where((v) => v.isOngoing);
      _ongoingVisit = ongoing.isEmpty ? null : ongoing.first;

      notifyListeners();
    } catch (e) {
      _lastError = 'Erreur chargement visites: $e';
      notifyListeners();
    }
  }

  Future<void> logout() async {
    stopTracking();
    await authService.logout();
    _clients = [];
    _todayVisits = [];
    notifyListeners();
  }

  void clearError() {
    _lastError = null;
    notifyListeners();
  }

  @override
  void dispose() {
    locationService.dispose();
    socketService.disconnect();
    super.dispose();
  }
}
