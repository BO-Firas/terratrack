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
    enteredAt: {
      type: Date,
      required: true,
      index: true,
    },
    leftAt: {
      type: Date, // null tant que l'agent est sur place
    },
    durationSeconds: {
      type: Number, // calcule a la sortie
    },
    // Position d'entree (peut differer un peu du centre du client)
    entryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    exitLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    // Statut de la visite
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'too_short', 'too_long', 'cancelled'],
      default: 'in_progress',
    },
    notes: String, // l'agent peut ajouter des notes manuellement
  },
  { timestamps: true }
);

// Methode utilitaire : terminer une visite et calculer la duree
visitSchema.methods.endVisit = function (exitLocation) {
  this.leftAt = new Date();
  this.durationSeconds = Math.round((this.leftAt - this.enteredAt) / 1000);
  if (exitLocation) this.exitLocation = exitLocation;

  // Determiner le statut selon la duree (par rapport aux attentes du client)
  // Cette logique peut etre raffinee en allant chercher client.expectedVisitDuration
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('Visit', visitSchema);
