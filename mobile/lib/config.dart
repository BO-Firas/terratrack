import 'package:flutter/material.dart';

/// Configuration globale de TerraTrack
class AppConfig {
  // Branding
  static const String appName = 'TerraTrack';
  static const String tagline = 'Field Operations';

  // URL du backend - 10.0.2.2 = adresse du PC depuis l'emulateur Android
  static const String apiBaseUrl = 'http://10.0.2.2:5000/api';
  static const String socketUrl = 'http://10.0.2.2:5000';

  // Cle API Google Maps
  static const String googleMapsApiKey = 'AIzaSyCHPhwXTNc6VOk7sp2Yqx7UKhDhrlXsMlc';

  // Tracking
  static const int gpsIntervalSeconds = 10;
  static const double minDistanceMeters = 5;

  // Centre par defaut : Gabes
  static const double defaultLatitude = 33.8881;
  static const double defaultLongitude = 10.0982;
}

/// Palette de couleurs TerraTrack - dark mode
class AppColors {
  // Backgrounds
  static const Color bgBase = Color(0xFF0A0E14);
  static const Color bgElevated = Color(0xFF11161D);
  static const Color bgOverlay = Color(0xFF1A212B);
  static const Color bgHover = Color(0xFF1F2730);

  // Text
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textTertiary = Color(0xFF64748B);

  // Accent emerald
  static const Color accent = Color(0xFF10B981);
  static const Color accentLight = Color(0xFF34D399);
  static const Color accentDark = Color(0xFF052E1C);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Borders
  static Color borderSubtle = Colors.white.withOpacity(0.06);
  static Color borderDefault = Colors.white.withOpacity(0.1);
}
