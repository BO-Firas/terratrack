const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Genere un token JWT pour un utilisateur
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register - creation d'un utilisateur (admin uniquement en prod)
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email deja utilise' });
    }

    const user = await User.create({ fullName, email, password, role, phone });
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login - connexion
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Inclure le password (select: false par defaut)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte desactive' });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me - infos sur l'utilisateur connecte
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
