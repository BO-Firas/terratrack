const mongoose = require('mongoose');

// Chaque position GPS transmise par un agent
// Cette collection grossit vite - prevoir TTL ou archivage
const locationPingSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // Metadonnees GPS utiles pour la qualite du signal
    accuracy: Number, // en metres
    speed: Number, // en m/s
    heading: Number, // en degres
    altitude: Number,
    batteryLevel: Number, // 0-100

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Index composes pour les requetes courantes
locationPingSchema.index({ agent: 1, timestamp: -1 });
locationPingSchema.index({ location: '2dsphere' });

// TTL optionnel : supprimer les pings de plus de 90 jours
// locationPingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('LocationPing', locationPingSchema);
