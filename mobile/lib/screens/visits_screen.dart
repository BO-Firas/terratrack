import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../models/visit.dart';
import '../providers/app_state.dart';

class VisitsScreen extends StatelessWidget {
  const VisitsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final visits = appState.todayVisits;

    return RefreshIndicator(
      onRefresh: () => appState.loadTodayVisits(),
      color: AppColors.accent,
      backgroundColor: AppColors.bgElevated,
      child: visits.isEmpty
          ? ListView(
              children: [
                const SizedBox(height: 100),
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.bgElevated,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: const Icon(
                          Icons.calendar_today_outlined,
                          size: 36,
                          color: AppColors.textTertiary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'AUCUNE VISITE AUJOURD\'HUI',
                        style: TextStyle(
                          fontSize: 12,
                          letterSpacing: 2,
                          color: AppColors.textTertiary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tirez vers le bas pour rafraichir',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: visits.length,
              itemBuilder: (_, i) => _VisitCard(visit: visits[i]),
            ),
    );
  }
}

class _VisitCard extends StatelessWidget {
  final Visit visit;
  const _VisitCard({required this.visit});

  Color get _statusColor {
    switch (visit.status) {
      case 'in_progress':
        return AppColors.info;
      case 'completed':
        return AppColors.success;
      case 'too_short':
        return AppColors.warning;
      case 'too_long':
        return AppColors.danger;
      default:
        return AppColors.textTertiary;
    }
  }

  String get _statusLabel {
    switch (visit.status) {
      case 'in_progress':
        return 'EN COURS';
      case 'completed':
        return 'TERMINEE';
      case 'too_short':
        return 'TROP COURTE';
      case 'too_long':
        return 'TROP LONGUE';
      default:
        return 'ANNULEE';
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('HH:mm');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  visit.clientName ?? 'Client',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: _statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  _statusLabel,
                  style: TextStyle(
                    color: _statusColor,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.access_time,
                  size: 13, color: AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(
                'Entree : ${timeFormat.format(visit.enteredAt.toLocal())}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontFamily: 'monospace',
                ),
              ),
              if (visit.leftAt != null) ...[
                const SizedBox(width: 12),
                Text(
                  'Sortie : ${timeFormat.format(visit.leftAt!.toLocal())}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.timer_outlined,
                  size: 13, color: AppColors.textTertiary),
              const SizedBox(width: 6),
              Text(
                'Duree : ${visit.formattedDuration}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
