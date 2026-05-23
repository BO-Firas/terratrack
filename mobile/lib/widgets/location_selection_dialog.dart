import 'package:flutter/material.dart';
import '../config.dart';

/// Dialogue de selection quand plusieurs geofences se chevauchent.
/// L'agent choisit le client qu'il visite reellement.
///
/// candidates : liste de Map { _id, name, type, address, distance }
/// onConfirm  : appele avec le clientId choisi
class LocationSelectionDialog extends StatelessWidget {
  final List<Map<String, dynamic>> candidates;
  final void Function(String clientId) onConfirm;

  const LocationSelectionDialog({
    super.key,
    required this.candidates,
    required this.onConfirm,
  });

  static const Map<String, String> _typeLabels = {
    'pharmacy': 'Pharmacie',
    'hospital': 'Hopital',
    'doctor': 'Medecin',
    'store': 'Point de vente',
    'other': 'Autre',
  };

  static const Map<String, IconData> _typeIcons = {
    'pharmacy': Icons.local_pharmacy,
    'hospital': Icons.local_hospital,
    'doctor': Icons.medical_services,
    'store': Icons.store,
    'other': Icons.place,
  };

  @override
  Widget build(BuildContext context) {
    return Dialog(
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
                const Icon(Icons.help_outline, color: AppColors.accent, size: 22),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Quelle location visitez-vous ?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Plusieurs etablissements sont proches. Selectionnez celui que vous visitez.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            ...candidates.map((c) {
              final type = c['type']?.toString() ?? 'other';
              final dist = c['distance'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    onConfirm(c['_id'].toString());
                    Navigator.of(context).pop();
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.bgBase,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderDefault),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(_typeIcons[type] ?? Icons.place,
                              color: AppColors.accent, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c['name']?.toString() ?? 'Client',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${_typeLabels[type] ?? type}'
                                '${dist != null ? '  •  ${dist}m' : ''}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right,
                            color: AppColors.textTertiary, size: 20),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text(
                  'Plus tard',
                  style: TextStyle(color: AppColors.textTertiary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
