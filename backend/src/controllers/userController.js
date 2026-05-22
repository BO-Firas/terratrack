const User = require('../models/User');
const Visit = require('../models/Visit');

// =====================================================================
//  Gestion des utilisateurs - reservee a l'administrateur
//  CRUD complet : creer, lister, modifier, activer/desactiver
// =====================================================================

// GET /api/users - liste de tous les utilisateurs (avec filtre role optionnel)
exports.listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .populate('assignedZones', 'name color')
      .sort({ role: 1, fullName: 1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('assignedZones', 'name color');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users - creer un nouvel utilisateur (agent, superviseur ou admin)
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone, assignedZones } = req.body;

    // Validation minimale
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'Champs requis : nom complet, email, mot de passe et role',
      });
    }

    if (!['agent', 'supervisor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role invalide' });
    }

    // Email deja utilise ?
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Cet email est deja utilise' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      phone,
      // Les zones ne concernent que les agents
      assignedZones: role === 'agent' ? assignedZones || [] : [],
    });

    // Recharger sans le mot de passe et avec les zones peuplees
    const created = await User.findById(user._id).populate('assignedZones', 'name color');

    res.status(201).json({ user: created });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - modifier un utilisateur (nom, email, telephone, role, zones, etat)
exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'email', 'phone', 'role', 'assignedZones', 'isActive'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Si l'email change, verifier qu'il n'est pas deja pris par un autre
    if (updates.email) {
      const existing = await User.findOne({
        email: updates.email.toLowerCase().trim(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({ message: 'Cet email est deja utilise' });
      }
    }

    // Si on repasse en non-agent, on vide les zones
    if (updates.role && updates.role !== 'agent') {
      updates.assignedZones = [];
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('assignedZones', 'name color');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/password - reinitialiser le mot de passe d'un utilisateur
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caracteres',
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.password = password; // le hook pre-save du modele va le hasher
    await user.save();

    res.json({ message: 'Mot de passe reinitialise avec succes' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/toggle - activer / desactiver un compte
exports.toggleActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    // Empecher un admin de se desactiver lui-meme
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas desactiver votre propre compte' });
    }

    user.isActive = !user.isActive;
    await user.save();

    const updated = await User.findById(user._id).populate('assignedZones', 'name color');
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id - suppression (avec garde-fou)
// On preconise la desactivation, mais la suppression reste possible
// si l'utilisateur n'a aucune visite enregistree.
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Si l'agent a des visites, on refuse la suppression (preserver l'historique)
    const visitCount = await Visit.countDocuments({ agent: user._id });
    if (visitCount > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer : cet utilisateur a ${visitCount} visite(s) enregistree(s). Desactivez-le plutot.`,
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprime avec succes' });
  } catch (error) {
    next(error);
  }
};
