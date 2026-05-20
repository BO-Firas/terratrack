/// Modele client (pharmacie, hopital, medecin, etc.)
class Client {
  final String id;
  final String name;
  final String type;
  final String? address;
  final String? phone;
  final String? contactPerson;
  final double longitude;
  final double latitude;
  final double geofenceRadius;

  Client({
    required this.id,
    required this.name,
    required this.type,
    this.address,
    this.phone,
    this.contactPerson,
    required this.longitude,
    required this.latitude,
    required this.geofenceRadius,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    final coords = (json['location']?['coordinates'] as List?) ?? [0.0, 0.0];
    return Client(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'other',
      address: json['address'],
      phone: json['phone'],
      contactPerson: json['contactPerson'],
      longitude: (coords[0] as num).toDouble(),
      latitude: (coords[1] as num).toDouble(),
      geofenceRadius: (json['geofenceRadius'] ?? 50).toDouble(),
    );
  }

  /// Etiquette francaise du type de client
  String get typeLabel {
    switch (type) {
      case 'pharmacy':
        return 'Pharmacie';
      case 'hospital':
        return 'Hopital';
      case 'doctor':
        return 'Medecin';
      case 'store':
        return 'Point de vente';
      default:
        return 'Autre';
    }
  }
}
