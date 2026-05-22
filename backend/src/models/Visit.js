const mongoose = require('mongoose');

// Une visite = entree dans le geofence d'un client jusqu'a sa sortie
const visitSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    enteredAt: { type: Date, required: true, index: true },
    leftAt: { type: Date },
    durationSeconds: { type: Number },
    entryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    exitLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'too_short', 'too_long', 'cancelled'],
      default: 'in_progress',
    },
    // ===== Gestion du chevauchement de geofences =====
    // Quand plusieurs clients se chevauchent, la visite demarre automatiquement
    // sur le client le plus proche mais reste "non confirmee" tant que l'agent
    // n'a pas valide (ou corrige) le client reellement visite.
    isConfirmed: { type: Boolean, default: true, index: true },
    candidateClients: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    ],
    notes: String,
  },
  { timestamps: true }
);

visitSchema.methods.endVisit = function (exitLocation) {
  this.leftAt = new Date();
  this.durationSeconds = Math.round((this.leftAt - this.enteredAt) / 1000);
  if (exitLocation) this.exitLocation = exitLocation;
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('Visit', visitSchema);
