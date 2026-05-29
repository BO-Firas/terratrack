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

  Future<void> _openNoteDialog(BuildContext context) async {
    final controller = TextEditingController(text: visit.notes ?? '');
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: AppColors.bgElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.edit_note, color: AppColors.accent, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      visit.notes == null || visit.notes!.isEmpty
                          ? 'Ajouter une note'
                          : 'Modifier la note',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                visit.clientName ?? 'Client',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: controller,
                autofocus: true,
                maxLines: 5,
                maxLength: 500,
                style: const TextStyle(
                    color: AppColors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Ex: client absent, commande passee, a rappeler...',
                  hintStyle: const TextStyle(
                      color: AppColors.textTertiary, fontSize: 13),
                  filled: true,
                  fillColor: AppColors.bgBase,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: AppColors.borderDefault),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: AppColors.borderDefault),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide:
                        const BorderSide(color: AppColors.accent, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.of(ctx).pop(null),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.bgBase,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Annuler',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () =>
                          Navigator.of(ctx).pop(controller.text.trim()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Enregistrer',
                        style: TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (result == null) return; // cancelled

    final appState = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);
    try {
      await appState.apiService.addVisitNotes(visit.id, result);
      await appState.loadTodayVisits();
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Note enregistree'),
          backgroundColor: AppColors.success,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (_) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Erreur lors de l\'enregistrement'),
          backgroundColor: AppColors.danger,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('HH:mm');
    final hasNote = visit.notes != null && visit.notes!.trim().isNotEmpty;

    return GestureDetector(
      onTap: () => _openNoteDialog(context),
      child: Container(
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
            // Note display (or "Add note" prompt)
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: hasNote
                    ? AppColors.accent.withOpacity(0.08)
                    : AppColors.bgBase,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: hasNote
                      ? AppColors.accent.withOpacity(0.25)
                      : AppColors.borderSubtle,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    hasNote ? Icons.sticky_note_2 : Icons.add_comment_outlined,
                    size: 15,
                    color:
                        hasNote ? AppColors.accent : AppColors.textTertiary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      hasNote ? visit.notes! : 'Ajouter une note...',
                      style: TextStyle(
                        fontSize: 12,
                        color: hasNote
                            ? AppColors.textPrimary
                            : AppColors.textTertiary,
                        fontStyle:
                            hasNote ? FontStyle.normal : FontStyle.italic,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.edit,
                    size: 13,
                    color: AppColors.textTertiary,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
