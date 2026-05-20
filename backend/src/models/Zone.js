const mongoose = require('mongoose');

// Zone geographique autorisee (secteur, gouvernorat, region)
const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la zone est obligatoire'],
      trim: true,
    },
    description: String,

    // Type de zone
    type: {
      type: String,
      enum: ['governorate', 'city', 'sector', 'medical_region', 'custom'],
      default: 'sector',
    },

    // Polygone delimitant la zone (GeoJSON Polygon)
    // Format: { type: 'Polygon', coordinates: [[ [lng,lat], [lng,lat], ... ]] }
    area: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
      },
      coordinates: {
        type: [[[Number]]], // tableau de tableaux de [lng, lat]
        required: [true, 'La zone geographique est obligatoire'],
      },
    },

    color: {
      type: String,
      default: '#3388ff', // pour affichage sur la carte
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index geospatial - permet de tester si un point est dans la zone
zoneSchema.index({ area: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
