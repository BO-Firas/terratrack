/// Modele visite client
class Visit {
  final String id;
  final String agentId;
  final String clientId;
  final String? clientName;
  final String? clientType;
  final DateTime enteredAt;
  final DateTime? leftAt;
  final int? durationSeconds;
  final String status; // in_progress, completed, too_short, too_long, cancelled
  final String? notes;

  Visit({
    required this.id,
    required this.agentId,
    required this.clientId,
    this.clientName,
    this.clientType,
    required this.enteredAt,
    this.leftAt,
    this.durationSeconds,
    required this.status,
    this.notes,
  });

  factory Visit.fromJson(Map<String, dynamic> json) {
    String agentId = '';
    String clientId = '';
    String? clientName;
    String? clientType;

    if (json['agent'] is String) {
      agentId = json['agent'];
    } else if (json['agent'] is Map) {
      agentId = json['agent']['_id'] ?? '';
    }

    if (json['client'] is String) {
      clientId = json['client'];
    } else if (json['client'] is Map) {
      clientId = json['client']['_id'] ?? '';
      clientName = json['client']['name'];
      clientType = json['client']['type'];
    }

    return Visit(
      id: json['_id'] ?? '',
      agentId: agentId,
      clientId: clientId,
      clientName: clientName,
      clientType: clientType,
      enteredAt: DateTime.parse(json['enteredAt']),
      leftAt: json['leftAt'] != null ? DateTime.parse(json['leftAt']) : null,
      durationSeconds: json['durationSeconds'],
      status: json['status'] ?? 'in_progress',
      notes: json['notes'],
    );
  }

  bool get isOngoing => status == 'in_progress';

  String get formattedDuration {
    if (durationSeconds == null) return '-';
    final s = durationSeconds!;
    if (s < 60) return '${s}s';
    final m = s ~/ 60;
    final r = s % 60;
    return '${m}m ${r}s';
  }
}
