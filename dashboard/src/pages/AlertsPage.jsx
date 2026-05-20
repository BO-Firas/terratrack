import { useEffect, useState } from 'react';
import { alertsAPI } from '../services/api';
import { getSocket } from '../services/socket';
import PageHeader from '../components/PageHeader';
import { AlertTriangle, CheckCircle, Info, AlertOctagon } from 'lucide-react';

const severityConfig = {
  info: { color: '#3b82f6', icon: Info },
  warning: { color: '#f59e0b', icon: AlertTriangle },
  critical: { color: '#ef4444', icon: AlertOctagon },
};

const typeLabels = {
  out_of_zone: 'Sortie de zone',
  visit_too_short: 'Visite trop courte',
  visit_too_long: 'Visite trop longue',
  agent_inactive: 'Agent inactif',
  no_activity_today: 'Aucune activite',
  entered_forbidden_zone: 'Zone interdite',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    alertsAPI
      .list()
      .then((res) => setAlerts(res.data.alerts))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleAlert(data) {
      setAlerts((prev) => [data.alert, ...prev]);
    }
    socket.on('agent:alert', handleAlert);
    return () => socket.off('agent:alert', handleAlert);
  }, []);

  async function handleResolve(id) {
    try {
      const res = await alertsAPI.resolve(id);
      setAlerts((prev) => prev.map((a) => (a._id === id ? res.data.alert : a)));
    } catch (err) {
      console.error('Erreur resolution alerte:', err);
    }
  }

  const filtered = showResolved ? alerts : alerts.filter((a) => !a.isResolved);
  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Alertes"
        subtitle={`${unresolvedCount} alerte${unresolvedCount > 1 ? 's' : ''} non resolue${unresolvedCount > 1 ? 's' : ''}`}
      >
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="accent-[var(--accent-primary)]"
          />
          Afficher les resolues
        </label>
      </PageHeader>

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="tt-card p-16 text-center">
            <CheckCircle className="mx-auto text-[var(--color-success)] mb-3" size={40} />
            <p className="text-[var(--text-tertiary)] text-sm">
              Aucune alerte active
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((alert) => {
              const config = severityConfig[alert.severity] || severityConfig.warning;
              const Icon = config.icon;
              return (
                <div
                  key={alert._id}
                  className="tt-card p-4 flex items-start gap-3 fade-in"
                  style={{
                    borderLeft: `3px solid ${config.color}`,
                  }}
                >
                  <Icon style={{ color: config.color }} className="flex-shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: config.color }}
                      >
                        {typeLabels[alert.type] || alert.type}
                      </span>
                      {alert.isResolved && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-tertiary)] uppercase tracking-wider">
                          Resolue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                      <span>{alert.agent?.fullName}</span>
                      <span>•</span>
                      <span className="font-mono">
                        {new Date(alert.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  {!alert.isResolved && (
                    <button
                      onClick={() => handleResolve(alert._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-md transition"
                      style={{
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--accent-primary-bg)',
                        border: '1px solid var(--accent-primary-border)',
                      }}
                    >
                      Resoudre
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
