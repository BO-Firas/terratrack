const mongoose = require('mongoose');

// Alertes generees automatiquement par le systeme
const alertSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'out_of_zone', // sortie de la zone autorisee
        'visit_too_short', // visite trop courte
        'visit_too_long', // visite trop longue
        'agent_inactive', // pas de mouvement prolonge
        'no_activity_today', // aucune activite enregistree dans la journee
        'entered_forbidden_zone',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    message: {
      type: String,
      required: true,
    },
    // Donnees contextuelles flexibles (selon type d'alerte)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    // Etat de l'alerte
    isRead: {
      type: Boolean,
      default: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

alertSchema.index({ agent: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1, severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
