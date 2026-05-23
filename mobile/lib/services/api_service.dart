import 'package:dio/dio.dart';
import '../config.dart';
import 'auth_service.dart';

/// Service centralise pour les appels HTTP au backend
/// Utilise Dio avec un intercepteur pour injecter le token JWT
class ApiService {
  late final Dio _dio;
  final AuthService _authService;

  ApiService(this._authService) {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      contentType: 'application/json',
    ));

    // Intercepteur : ajouter le token JWT a chaque requete
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _authService.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        // En cas de 401, deconnecter l'utilisateur
        if (e.response?.statusCode == 401) {
          _authService.logout();
        }
        return handler.next(e);
      },
    ));
  }

  // ============ Authentification ============

  Future<Response> login(String email, String password) {
    return _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> getMe() => _dio.get('/auth/me');

  // ============ Clients ============

  Future<Response> getClients() => _dio.get('/clients');

  Future<Response> getNearbyClients(double lng, double lat, {double maxDistance = 500}) {
    return _dio.get('/clients/near', queryParameters: {
      'lng': lng,
      'lat': lat,
      'maxDistance': maxDistance,
    });
  }

  // ============ Zones ============

  Future<Response> getZones() => _dio.get('/zones');

  // ============ Visites ============

  Future<Response> getTodayVisits() => _dio.get('/visits/today');

  Future<Response> addVisitNotes(String visitId, String notes) {
    return _dio.put('/visits/$visitId/notes', data: {'notes': notes});
  }

  // ============ Alertes ============

  Future<Response> getAlerts() => _dio.get('/alerts');

  Future<Response> markAlertRead(String alertId) {
    return _dio.put('/alerts/$alertId/read');
  }
  // Confirmer le client visite (chevauchement de geofences)
  Future<Response> confirmVisit(String visitId, String clientId) {
    return _dio.put('/visits/$visitId/confirm', data: {'clientId': clientId});
  }

  // Statistiques de l'agent connecte
  Future<Response> getMyStats() => _dio.get('/stats/me');
}
