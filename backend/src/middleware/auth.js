const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifie le token JWT et attache l'utilisateur a la requete
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Utilisateur invalide ou desactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expire' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
}

// Restreint l'acces selon les roles autorises
// Usage: router.get('/admin', authenticate, authorize('admin'), handler)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Acces refuse - permissions insuffisantes',
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
