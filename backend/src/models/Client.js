const mongoose = require('mongoose');

// Client a visiter (pharmacie, medecin, hopital, point de vente)
const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du client est obligatoire'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['pharmacy', 'doctor', 'hospital', 'store', 'other'],
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: String,
    contactPerson: String,

    // Position GPS du client (GeoJSON Point)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Les coordonnees GPS sont obligatoires'],
      },
    },

    // Rayon du geofence en metres (30-50m selon le type)
    geofenceRadius: {
      type: Number,
      default: 50,
      min: 10,
      max: 500,
    },

    // Zone administrative a laquelle ce client appartient
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },

    // Duree minimale et maximale attendue d'une visite (en minutes)
    expectedVisitDuration: {
      min: { type: Number, default: 5 },
      max: { type: Number, default: 60 },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index geospatial - essentiel pour les requetes de geofencing
clientSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Client', clientSchema);
