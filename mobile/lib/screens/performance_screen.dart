import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config.dart';
import '../providers/app_state.dart';

/// Ecran de performance de l'agent connecte.
/// Affiche ses statistiques personnelles + visites recentes (via /api/stats/me).
class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final appState = context.read<AppState>();
      final res = await appState.apiService.getMyStats();
      setState(() { _stats = Map<String, dynamic>.from(res.data); _loading = false; });
    } catch (e) {
      setState(() { _error = 'Impossible de charger les statistiques'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.accent));
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _load, child: const Text('Reessayer')),
          ],
        ),
      );
    }

    final summary = Map<String, dynamic>.from(_stats?['summary'] ?? {});
    final byDay = List<Map<String, dynamic>>.from(
      (_stats?['visitsByDay'] ?? []).map((e) => Map<String, dynamic>.from(e)),
    );

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.accent,
      backgroundColor: AppColors.bgElevated,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('MA PERFORMANCE',
              style: TextStyle(fontSize: 11, letterSpacing: 2, color: AppColors.textTertiary, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),

          // Cartes de stats (2x2 + 2)
          Row(children: [
            _StatCard(value: '${summary['todayVisits'] ?? 0}', label: 'Aujourd\'hui', icon: Icons.today, color: AppColors.info),
            const SizedBox(width: 12),
            _StatCard(value: '${summary['weekVisits'] ?? 0}', label: 'Cette semaine', icon: Icons.date_range, color: AppColors.accent),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _StatCard(value: '${summary['totalVisits'] ?? 0}', label: 'Total visites', icon: Icons.check_circle_outline, color: const Color(0xFF7C3AED)),
            const SizedBox(width: 12),
            _StatCard(value: '${summary['avgDurationMinutes'] ?? 0} min', label: 'Duree moyenne', icon: Icons.timer_outlined, color: AppColors.warning),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _StatCard(value: '${summary['totalDurationMinutes'] ?? 0} min', label: 'Temps total', icon: Icons.access_time, color: const Color(0xFF0891B2)),
            const SizedBox(width: 12),
            _StatCard(value: '${summary['completedVisits'] ?? 0}', label: 'Terminees', icon: Icons.done_all, color: AppColors.success),
          ]),

          if ((summary['unconfirmedVisits'] ?? 0) > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.warning.withOpacity(0.3)),
              ),
              child: Row(children: [
                const Icon(Icons.warning_amber, color: AppColors.warning, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${summary['unconfirmedVisits']} visite(s) a confirmer (chevauchement de zones)',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ),
              ]),
            ),
          ],

          const SizedBox(height: 24),
          const Text('VISITES DES 7 DERNIERS JOURS',
              style: TextStyle(fontSize: 11, letterSpacing: 2, color: AppColors.textTertiary, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _BarChart(data: byDay),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value, label;
  final IconData icon;
  final Color color;
  const _StatCard({required this.value, required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 10),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1)),
            const SizedBox(height: 4),
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, letterSpacing: 1, color: AppColors.textTertiary, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _BarChart extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const _BarChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final maxV = data.fold<int>(1, (m, d) => (d['count'] ?? 0) > m ? (d['count'] as int) : m);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: [
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((d) {
                final count = (d['count'] ?? 0) as int;
                final h = (count / maxV) * 100;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text('$count', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 2),
                        Container(
                          height: h < 4 ? 4 : h,
                          decoration: BoxDecoration(
                            color: count > 0 ? AppColors.accent : AppColors.borderDefault,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: data.map((d) {
              return Expanded(
                child: Text(
                  d['label']?.toString() ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 9, color: AppColors.textTertiary),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
