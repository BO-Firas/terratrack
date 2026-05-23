const User = require('../models/User');
const Visit = require('../models/Visit');
const Alert = require('../models/Alert');

// Seuils (modifiables)
const INACTIVITY_MINUTES = 30;          // pas de position depuis 30 min -> inactif
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // verifier toutes les 5 minutes

/**
 * Detecte les agents inactifs : leur derniere position connue date de plus
 * de INACTIVITY_MINUTES alors qu'ils sont actifs.
 */
async function checkInactiveAgents(io) {
  try {
    const threshold = new Date(Date.now() - INACTIVITY_MINUTES * 60 * 1000);
    const agents = await User.find({
      role: 'agent',
      isActive: true,
      'lastKnownLocation.updatedAt': { $exists: true, $lt: threshold },
    });

    for (const agent of agents) {
      const recent = await Alert.findOne({
        agent: agent._id,
        type: 'agent_inactive',
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });
      if (recent) continue;

      const alert = await Alert.create({
        agent: agent._id,
        type: 'agent_inactive',
        severity: 'warning',
        message: `${agent.fullName} est inactif depuis plus de ${INACTIVITY_MINUTES} minutes`,
        location: agent.lastKnownLocation?.coordinates
          ? { type: 'Point', coordinates: agent.lastKnownLocation.coordinates }
          : undefined,
      });
      if (io) io.to('supervisors').emit('agent:alert', { alert });
    }
  } catch (err) {
    console.error('[InactivityJob] Erreur:', err.message);
  }
}

/**
 * Agents actifs sans aucune visite aujourd'hui. Verifie une fois par jour
 * apres 20h (on memorise le dernier jour traite pour ne le faire qu'une fois).
 */
let lastNoActivityDay = null;
async function maybeCheckNoActivity(io) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  // Declenche apres 20h, une seule fois par jour
  if (now.getHours() < 20 || lastNoActivityDay === today) return;
  lastNoActivityDay = today;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const agents = await User.find({ role: 'agent', isActive: true });

    for (const agent of agents) {
      const visitCount = await Visit.countDocuments({
        agent: agent._id,
        enteredAt: { $gte: startOfDay },
      });
      if (visitCount > 0) continue;

      const existing = await Alert.findOne({
        agent: agent._id,
        type: 'no_activity_today',
        createdAt: { $gte: startOfDay },
      });
      if (existing) continue;

      const alert = await Alert.create({
        agent: agent._id,
        type: 'no_activity_today',
        severity: 'warning',
        message: `${agent.fullName} n'a effectue aucune visite aujourd'hui`,
      });
      if (io) io.to('supervisors').emit('agent:alert', { alert });
    }
  } catch (err) {
    console.error('[NoActivityJob] Erreur:', err.message);
  }
}

/**
 * Demarre les verifications periodiques (sans dependance externe).
 * A appeler depuis server.js avec l'instance io.
 */
function startScheduledJobs(io) {
  setInterval(() => {
    checkInactiveAgents(io);
    maybeCheckNoActivity(io);
  }, CHECK_INTERVAL_MS);

  console.log('[Jobs] Verifications periodiques demarrees (inactivite + activite journaliere)');
}

module.exports = { startScheduledJobs, checkInactiveAgents, maybeCheckNoActivity };
