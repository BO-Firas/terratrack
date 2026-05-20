import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config.dart';
import '../models/user.dart';

/// Service d'authentification
/// Stocke le token JWT de maniere securisee (Keystore sur Android)
class AuthService {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';

  final _storage = const FlutterSecureStorage();
  final _dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));

  User? _currentUser;
  User? get currentUser => _currentUser;

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<User?> getStoredUser() async {
    if (_currentUser != null) return _currentUser;

    final userJson = await _storage.read(key: _userKey);
    if (userJson == null) return null;

    try {
      _currentUser = User.fromJson(jsonDecode(userJson));
      return _currentUser;
    } catch (_) {
      return null;
    }
  }

  /// Tentative de connexion
  /// Retourne l'utilisateur si OK, lance une exception sinon
  Future<User> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final token = response.data['token'] as String;
      final user = User.fromJson(response.data['user']);

      // Verifier que c'est bien un agent (pas un superviseur)
      if (user.role != 'agent') {
        throw Exception(
          "Cette application est reservee aux agents terrain. "
          "Les superviseurs doivent utiliser le tableau de bord web.",
        );
      }

      await _storage.write(key: _tokenKey, value: token);
      await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
      _currentUser = user;

      return user;
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'Erreur de connexion';
      throw Exception(msg);
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    _currentUser = null;
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }
}
