// Gestionnaire global d'erreurs - a placer apres toutes les routes
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation echouee', errors });
  }

  // Cle dupliquee (ex: email deja utilise)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} deja utilise` });
  }

  // ID invalide
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID invalide' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Erreur serveur interne',
  });
}

module.exports = errorHandler;
