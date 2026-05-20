const mongoose = require('mongoose');

// Connexion a MongoDB avec gestion des erreurs
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Options modernes - Mongoose 8 gere la plupart par defaut
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
