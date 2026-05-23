const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modele utilisateur unifie - le role determine les permissions
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caracteres'],
      select: false, // ne pas renvoyer par defaut dans les queries
    },
    role: {
      type: String,
      enum: ['agent', 'supervisor', 'admin'],
      required: true,
      default: 'agent',
    },
    phone: {
      type: String,
      trim: true,
    },
    // Agents uniquement : zone(s) autorisee(s)
    assignedZones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
      },
    ],
    // Etat de l'agent
    isActive: {
      type: Boolean,
      default: true,
    },
    // Derniere position connue (optionnelle - absent tant que l'agent n'a pas envoye de position)
    lastKnownLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - ordre GeoJSON
      },
      updatedAt: Date,
    },
    dailyTarget: {
      type: Number,
      default: 0, // 0 = pas d'objectif defini
    },
  },
  { timestamps: true }
);

// sparse: true permet aux documents sans lastKnownLocation d'exister
userSchema.index({ lastKnownLocation: '2dsphere' }, { sparse: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Methode de comparaison de mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Renvoyer un JSON propre (sans le password meme s'il a ete selectionne)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
