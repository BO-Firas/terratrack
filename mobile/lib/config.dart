import 'package:flutter/material.dart';

/// Configuration globale de TerraTrack
class AppConfig {
  // Branding
  static const String appName = 'TerraTrack';
  static const String tagline = 'Field Operations';

  // URL du backend - 10.0.2.2 = adresse du PC depuis l'emulateur Android
  static const String apiBaseUrl = 'https://terratrack-backend.onrender.com/api';
  static const String socketUrl = 'https://terratrack-backend.onrender.com';

  // Cle API Google Maps
  static const String googleMapsApiKey = 'AIzaSyCHPhwXTNc6VOk7sp2Yqx7UKhDhrlXsMlc';

  // Tracking
  static const int gpsIntervalSeconds = 10;
  static const double minDistanceMeters = 5;

  // Centre par defaut : Gabes
  static const double defaultLatitude = 33.8881;
  static const double defaultLongitude = 10.0982;
}

/// Palette de couleurs TerraTrack - light mode
class AppColors {
  // Backgrounds
  static const Color bgBase = Color(0xFFF4F6F9);     // gris tres clair
  static const Color bgElevated = Color(0xFFFFFFFF); // blanc (cartes)
  static const Color bgOverlay = Color(0xFFFFFFFF);
  static const Color bgHover = Color(0xFFEEF1F5);

  // Text
  static const Color textPrimary = Color(0xFF0F172A);   // slate-900
  static const Color textSecondary = Color(0xFF475569); // slate-600
  static const Color textTertiary = Color(0xFF94A3B8);  // slate-400

  // Accent emerald (plus fonce pour etre lisible sur blanc)
  static const Color accent = Color(0xFF059669);      // emerald-600
  static const Color accentLight = Color(0xFF10B981); // emerald-500
  static const Color accentDark = Color(0xFFFFFFFF);  // texte sur boutons accent = blanc

  // Status
  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);

  // Borders
  static Color borderSubtle = Colors.black.withOpacity(0.07);
  static Color borderDefault = Colors.black.withOpacity(0.12);
}
