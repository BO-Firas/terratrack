import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../providers/app_state.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _controller;
  bool _centeredOnAgent = false;

  // Style dark mode Google Maps
  static const String _darkMapStyle = '''[
    {"elementType":"geometry","stylers":[{"color":"#f4f6f9"}]},
    {"elementType":"labels.text.stroke","stylers":[{"color":"#f4f6f9"}]},
    {"elementType":"labels.text.fill","stylers":[{"color":"#64748b"}]},
    {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#475569"}]},
    {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#94a3b8"}]},
    {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dcfce7"}]},
    {"featureType":"road","elementType":"geometry","stylers":[{"color":"#ffffff"}]},
    {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#e2e8f0"}]},
    {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#94a3b8"}]},
    {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#fef9c3"}]},
    {"featureType":"water","elementType":"geometry","stylers":[{"color":"#bae6fd"}]},
    {"featureType":"poi.business","stylers":[{"visibility":"off"}]}
  ]''';

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final position = appState.lastPosition;

    // Position par defaut : Gabes
    final initialPosition = position != null
        ? LatLng(position.latitude, position.longitude)
        : const LatLng(
            AppConfig.defaultLatitude, AppConfig.defaultLongitude);

    if (position != null && !_centeredOnAgent && _controller != null) {
      _controller!.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(position.latitude, position.longitude),
          15,
        ),
      );
      _centeredOnAgent = true;
    }

    final markers = <Marker>{};
    final circles = <Circle>{};

    // Clients
    for (final c in appState.clients) {
      circles.add(Circle(
        circleId: CircleId('geofence_${c.id}'),
        center: LatLng(c.latitude, c.longitude),
        radius: c.geofenceRadius,
        fillColor: AppColors.danger.withOpacity(0.08),
        strokeColor: AppColors.danger.withOpacity(0.5),
        strokeWidth: 1,
      ));

      markers.add(Marker(
        markerId: MarkerId(c.id),
        position: LatLng(c.latitude, c.longitude),
        infoWindow: InfoWindow(
          title: c.name,
          snippet: '${c.typeLabel} • ${c.geofenceRadius.toInt()}m',
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          c.type == 'pharmacy'
              ? BitmapDescriptor.hueGreen
              : c.type == 'hospital'
                  ? BitmapDescriptor.hueRed
                  : c.type == 'doctor'
                      ? BitmapDescriptor.hueOrange
                      : BitmapDescriptor.hueViolet,
        ),
      ));
    }

    // Agent
    if (position != null) {
      markers.add(Marker(
        markerId: const MarkerId('agent_me'),
        position: LatLng(position.latitude, position.longitude),
        infoWindow: const InfoWindow(title: 'Ma position'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        zIndex: 999,
      ));
    }

    return Container(
      color: AppColors.bgBase,
      child: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: initialPosition,
              zoom: 14,
            ),
            markers: markers,
            circles: circles,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            mapType: MapType.normal,
            style: _darkMapStyle,
            onMapCreated: (c) => _controller = c,
          ),

          // Bandeau "Visite en cours"
          if (appState.currentClient != null)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accent.withOpacity(0.4),
                      blurRadius: 16,
                      spreadRadius: -4,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'VISITE EN COURS',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                              letterSpacing: 1.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            appState.currentClient!.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Erreur en bas
          if (appState.lastError != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.danger.withOpacity(0.95),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.danger.withOpacity(0.3),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber, color: Colors.white),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        appState.lastError!,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close,
                          color: Colors.white, size: 18),
                      onPressed: () => appState.clearError(),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
