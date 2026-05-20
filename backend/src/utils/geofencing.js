const Client = require('../models/Client');
const Visit = require('../models/Visit');
const Zone = require('../models/Zone');
const Alert = require('../models/Alert');

// Distance entre deux points GPS (formule haversine, en metres)
function haversineDistance(coords1, coords2) {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 6371000; // rayon de la Terre en metres
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Verifie si une position est dans le geofence d'un client
 * Logique principale du geofencing automatique
 *
 * Cette fonction:
 * 1. Cherche les clients proches du point
 * 2. Pour chaque client dans le rayon: ouvre une visite si pas deja ouverte
 * 3. Pour les visites en cours dont l'agent n'est plus dans le rayon: ferme la visite
 *
 * @returns { entered: [Visit], exited: [Visit] }
 */
async function processGeofencing(agentId, coordinates) {
  const result = { entered: [], exited: [] };
  const [lng, lat] = coordinates;

  // 1. Trouver les clients dans un rayon de 200m (assez large pour couvrir les geofences max)
  const nearbyClients = await Client.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 200,
      },
    },
  });

  // 2. Trouver les visites en cours pour cet agent
  const ongoingVisits = await Visit.find({
    agent: agentId,
    status: 'in_progress',
  });

  const ongoingClientIds = new Set(ongoingVisits.map((v) => String(v.client)));

  // 3. Pour chaque client proche : verifier si on est dans son rayon
  for (const client of nearbyClients) {
    const distance = haversineDistance(coordinates, client.location.coordinates);
    const insideGeofence = distance <= client.geofenceRadius;

    if (insideGeofence && !ongoingClientIds.has(String(client._id))) {
      // Entree dans le geofence -> nouvelle visite
      const visit = await Visit.create({
        agent: agentId,
        client: client._id,
        enteredAt: new Date(),
        entryLocation: { type: 'Point', coordinates },
        status: 'in_progress',
      });
      result.entered.push(visit);
    }
  }

  // 4. Pour les visites en cours: si l'agent est sorti, fermer la visite
  for (const visit of ongoingVisits) {
    const client = nearbyClients.find((c) => String(c._id) === String(visit.client));

    let stillInside = false;
    if (client) {
      const distance = haversineDistance(coordinates, client.location.coordinates);
      stillInside = distance <= client.geofenceRadius;
    }

    if (!stillInside) {
      // Fermer la visite et evaluer sa duree
      await visit.endVisit(coordinates);

      // Recharger le client pour evaluer la duree (peut etre absent de nearbyClients si tres loin)
      const fullClient = client || (await Client.findById(visit.client));
      if (fullClient) {
        const minSec = (fullClient.expectedVisitDuration?.min || 5) * 60;
        const maxSec = (fullClient.expectedVisitDuration?.max || 60) * 60;

        if (visit.durationSeconds < minSec) {
          visit.status = 'too_short';
          await visit.save();
          await Alert.create({
            agent: agentId,
            type: 'visit_too_short',
            severity: 'warning',
            message: `Visite trop courte chez ${fullClient.name} (${visit.durationSeconds}s)`,
            metadata: { visitId: visit._id, clientId: fullClient._id },
            location: { type: 'Point', coordinates },
          });
        } else if (visit.durationSeconds > maxSec) {
          visit.status = 'too_long';
          await visit.save();
          await Alert.create({
            agent: agentId,
            type: 'visit_too_long',
            severity: 'info',
            message: `Visite anormalement longue chez ${fullClient.name}`,
            metadata: { visitId: visit._id, clientId: fullClient._id },
            location: { type: 'Point', coordinates },
          });
        }
      }

      result.exited.push(visit);
    }
  }

  return result;
}

/**
 * Verifie si l'agent est dans une de ses zones autorisees
 * Genere une alerte de sortie de zone si necessaire
 */
async function checkAuthorizedZone(agent, coordinates) {
  if (!agent.assignedZones || agent.assignedZones.length === 0) {
    return { inAuthorizedZone: true, alert: null }; // pas de zone assignee = pas de restriction
  }

  const [lng, lat] = coordinates;

  // Verifier si le point est dans au moins une zone assignee
  const matchingZone = await Zone.findOne({
    _id: { $in: agent.assignedZones },
    isActive: true,
    area: {
      $geoIntersects: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
      },
    },
  });

  if (matchingZone) {
    return { inAuthorizedZone: true, alert: null };
  }

  // Hors zone - generer une alerte (mais pas en doublon dans les 5 dernieres minutes)
  const recentAlert = await Alert.findOne({
    agent: agent._id,
    type: 'out_of_zone',
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });

  if (recentAlert) {
    return { inAuthorizedZone: false, alert: null };
  }

  const alert = await Alert.create({
    agent: agent._id,
    type: 'out_of_zone',
    severity: 'warning',
    message: `${agent.fullName} est sorti de sa zone autorisee`,
    location: { type: 'Point', coordinates },
  });

  return { inAuthorizedZone: false, alert };
}

module.exports = {
  haversineDistance,
  processGeofencing,
  checkAuthorizedZone,
};
