import { useEffect, useState } from 'react';
import { visitsAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const statusConfig = {
  in_progress: { label: 'En cours', color: '#3b82f6', icon: Clock },
  completed: { label: 'Terminee', color: '#10b981', icon: CheckCircle },
  too_short: { label: 'Trop courte', color: '#f59e0b', icon: AlertCircle },
  too_long: { label: 'Trop longue', color: '#ef4444', icon: AlertCircle },
  cancelled: { label: 'Annulee', color: '#6b7280', icon: AlertCircle },
};

function formatDuration(seconds) {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
}

export default function VisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    setLoading(true);
    visitsAPI
      .list({ date: dateFilter })
      .then((res) => setVisits(res.data.visits))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Visites"
        subtitle={`${visits.length} visite${visits.length > 1 ? 's' : ''} pour la date selectionnee`}
      >
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="tt-input"
          style={{ fontSize: '13px', padding: '8px 12px' }}
        />
      </PageHeader>

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">
            Chargement...
          </div>
        ) : visits.length === 0 ? (
          <div className="tt-card p-16 text-center">
            <Calendar className="mx-auto text-[var(--text-tertiary)] mb-3" size={40} />
            <p className="text-[var(--text-tertiary)] text-sm">
              Aucune visite pour cette date
            </p>
          </div>
        ) : (
          <div className="tt-card overflow-hidden">
            <table className="w-full">
              <thead
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Entree</th>
                  <th className="px-4 py-3 font-semibold">Sortie</th>
                  <th className="px-4 py-3 font-semibold">Duree</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit, i) => {
                  const status = statusConfig[visit.status] || statusConfig.completed;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={visit._id}
                      className="text-sm hover:bg-[var(--bg-overlay)] transition"
                      style={{
                        borderBottom:
                          i < visits.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {visit.agent?.fullName}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {visit.client?.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-tertiary)] font-mono text-xs">
                        {new Date(visit.enteredAt).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-tertiary)] font-mono text-xs">
                        {visit.leftAt
                          ? new Date(visit.leftAt).toLocaleTimeString('fr-FR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">
                        {formatDuration(visit.durationSeconds)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider"
                          style={{
                            backgroundColor: `${status.color}22`,
                            color: status.color,
                            border: `1px solid ${status.color}44`,
                          }}
                        >
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
