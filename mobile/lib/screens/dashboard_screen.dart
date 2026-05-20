import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../providers/app_state.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final visits = appState.todayVisits;
    final completed = visits.where((v) => !v.isOngoing).length;
    final ongoing = appState.ongoingVisit;
    final currentClient = appState.currentClient;

    return RefreshIndicator(
      onRefresh: () => appState.loadTodayVisits(),
      color: AppColors.accent,
      backgroundColor: AppColors.bgElevated,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Carte "Visite en cours"
          if (currentClient != null || ongoing != null) ...[
            _OngoingVisitCard(
              clientName: currentClient?.name ?? ongoing?.clientName ?? '?',
              startTime: ongoing?.enteredAt,
            ),
            const SizedBox(height: 14),
          ],

          // Stats
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'VISITES',
                  value: '$completed',
                  icon: Icons.check_circle_outline,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'CLIENTS',
                  value: '${appState.clients.length}',
                  icon: Icons.business_outlined,
                  color: AppColors.info,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // GPS info
          if (appState.lastPosition != null)
            _GpsInfoCard(
              latitude: appState.lastPosition!.latitude,
              longitude: appState.lastPosition!.longitude,
              accuracy: appState.lastPosition!.accuracy,
            ),

          const SizedBox(height: 20),

          // Dernieres visites
          if (visits.isNotEmpty) ...[
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              child: Text(
                'DERNIERES VISITES',
                style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 2,
                  color: AppColors.textTertiary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 4),
            ...visits.take(5).map((v) => _VisitTile(visit: v)),
          ],
        ],
      ),
    );
  }
}

class _OngoingVisitCard extends StatelessWidget {
  final String clientName;
  final DateTime? startTime;

  const _OngoingVisitCard({required this.clientName, this.startTime});

  String _elapsed() {
    if (startTime == null) return '...';
    final s = DateTime.now().difference(startTime!).inSeconds;
    if (s < 60) return '${s}s';
    final m = s ~/ 60;
    final r = s % 60;
    return '${m}m ${r.toString().padLeft(2, '0')}s';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withOpacity(0.4),
            blurRadius: 24,
            spreadRadius: -4,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.location_on,
                    color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              const Text(
                'VISITE EN COURS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            clientName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.timer_outlined,
                  color: Colors.white70, size: 16),
              const SizedBox(width: 6),
              StreamBuilder(
                stream: Stream.periodic(const Duration(seconds: 1)),
                builder: (_, __) => Text(
                  _elapsed(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textTertiary,
              fontSize: 10,
              letterSpacing: 2,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _GpsInfoCard extends StatelessWidget {
  final double latitude;
  final double longitude;
  final double accuracy;

  const _GpsInfoCard({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.accent.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.accent.withOpacity(0.3)),
            ),
            child: const Icon(
              Icons.gps_fixed,
              color: AppColors.accent,
              size: 18,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'POSITION GPS',
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: AppColors.textTertiary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}',
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  'Precision : ${accuracy.toStringAsFixed(1)}m',
                  style: const TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VisitTile extends StatelessWidget {
  final dynamic visit;
  const _VisitTile({required this.visit});

  @override
  Widget build(BuildContext context) {
    final color = visit.isOngoing
        ? AppColors.info
        : visit.status == 'completed'
            ? AppColors.success
            : AppColors.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit.clientName ?? 'Client',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${visit.enteredAt.hour.toString().padLeft(2, '0')}:${visit.enteredAt.minute.toString().padLeft(2, '0')} · ${visit.formattedDuration}',
                  style: const TextStyle(
                    color: AppColors.textTertiary,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          if (visit.isOngoing)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.info.withOpacity(0.3)),
              ),
              child: const Text(
                'EN COURS',
                style: TextStyle(
                  color: AppColors.info,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
