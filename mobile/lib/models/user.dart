/// Modele utilisateur - miroir du model Mongoose cote backend
class User {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? phone;
  final List<String> assignedZones; // liste d'IDs de zones

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.phone,
    this.assignedZones = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final zones = json['assignedZones'] as List? ?? [];
    return User(
      id: json['_id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'agent',
      phone: json['phone'],
      assignedZones: zones
          .map((z) => z is String ? z : (z['_id'] ?? '').toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'fullName': fullName,
        'email': email,
        'role': role,
        'phone': phone,
        'assignedZones': assignedZones,
      };
}
