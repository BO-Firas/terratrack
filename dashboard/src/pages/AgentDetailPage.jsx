import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { statsAPI } from '../services/api';
import {
  ArrowLeft, MapPin, Phone, Mail, Clock, CheckCircle,
  Calendar, AlertTriangle, TrendingUp, Activity, FileText,
} from 'lucide-react';

const typeLabels = {
  pharmacy: 'Pharmacie', hospital: 'Hopital', doctor: 'Medecin',
  store: 'Point de vente', other: 'Autre',
};
const statusLabels = {
  in_progress: 'En cours', completed: 'Terminee',
  too_short: 'Trop courte', too_long: 'Trop longue', cancelled: 'Annulee',
};

export default function AgentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    statsAPI.agent(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">Chargement...</div>;
  }
  if (error || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-[var(--color-danger)]">{error || 'Agent introuvable'}</p>
        <button onClick={() => navigate('/agents')} className="tt-button-primary">Retour aux agents</button>
      </div>
    );
  }

  const { agent, summary, visitsByDay, avgDurationByDay, visitsByType, byStatus } = data;

  return (
    <div className="h-full overflow-y-auto">
      {/* En-tete */}
      <div className="px-7 py-5 flex items-center gap-4"
        style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate('/agents')}
          className="p-2 rounded-lg transition" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <ArrowLeft size={18} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent-primary), #34d399)', color: '#fff' }}>
          {agent.fullName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{agent.fullName}</h1>
          <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1"><Mail size={12} /> {agent.email}</span>
            {agent.phone && <span className="flex items-center gap-1"><Phone size={12} /> {agent.phone}</span>}
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agent.isActive ? 'var(--color-success)' : 'var(--text-tertiary)' }} />
              {agent.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {agent.assignedZones?.length > 0 && (
            <div className="flex gap-1.5">
              {agent.assignedZones.map((z) => (
                <span key={z._id} className="text-[10px] px-2 py-1 rounded-md font-medium"
                  style={{ backgroundColor: `${z.color}1a`, color: z.color, border: `1px solid ${z.color}40` }}>
                  {z.name}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate(`/agents/${id}/report-period`)}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-base)')}
          >
            <Calendar size={16} />
            Rapport periode
          </button>
          <button
            onClick={() => navigate(`/agents/${id}/report`)}
            className="tt-button-primary flex items-center gap-2 whitespace-nowrap"
          >
            <FileText size={16} />
            Rapport journalier
          </button>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* Cartes de stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Calendar} color="#2563eb" value={summary.todayVisits} label="Visites aujourd'hui" />
          <StatCard icon={TrendingUp} color="#059669" value={summary.weekVisits} label="Cette semaine" />
          <StatCard icon={CheckCircle} color="#7c3aed" value={summary.totalVisits} label="Total visites" />
          <StatCard icon={Clock} color="#d97706" value={`${summary.avgDurationMinutes} min`} label="Duree moyenne" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} color="#0891b2" value={`${summary.totalDurationMinutes} min`} label="Temps total" />
          <StatCard icon={CheckCircle} color="#059669" value={summary.completedVisits} label="Visites terminees" />
          <StatCard icon={AlertTriangle} color="#d97706" value={summary.unconfirmedVisits} label="Non confirmees" highlight={summary.unconfirmedVisits > 0} />
          <StatCard icon={AlertTriangle} color="#dc2626" value={summary.activeAlerts} label="Alertes actives" highlight={summary.activeAlerts > 0} />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Visites des 7 derniers jours</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">Nombre de visites par jour</p>
            <BarChart data={visitsByDay.map((d) => ({ label: d.label, value: d.count }))} color="#059669" />
          </div>

          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Duree moyenne par jour</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">En minutes</p>
            <BarChart data={avgDurationByDay.map((d) => ({ label: d.label, value: d.avgMinutes }))} color="#2563eb" suffix=" min" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Repartition par type de client</h3>
            {visitsByType.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-3">
                {visitsByType.map((t) => {
                  const total = visitsByType.reduce((s, x) => s + x.count, 0);
                  const pct = Math.round((t.count / total) * 100);
                  return (
                    <div key={t.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{typeLabels[t.type] || t.type}</span>
                        <span className="text-[var(--text-tertiary)] font-mono">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#059669' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Repartition par statut</h3>
            {Object.keys(byStatus).length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-3">
                {Object.entries(byStatus).map(([status, count]) => {
                  const total = Object.values(byStatus).reduce((s, x) => s + x, 0);
                  const pct = Math.round((count / total) * 100);
                  const colors = { completed: '#059669', in_progress: '#2563eb', too_short: '#d97706', too_long: '#dc2626', cancelled: '#6b7280' };
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{statusLabels[status] || status}</span>
                        <span className="text-[var(--text-tertiary)] font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[status] || '#6b7280' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label, highlight }) {
  return (
    <div className="tt-card p-4" style={highlight ? { borderColor: `${color}66` } : {}}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}1a` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1.5">{label}</div>
    </div>
  );
}

function BarChart({ data, color, suffix = '' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 100, H = 60, gap = 3;
  const barW = (W - gap * (data.length - 1)) / data.length;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 12}`} style={{ width: '100%', height: '160px' }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.value / max) * H;
          const x = i * (barW + gap);
          return (
            <g key={i}>
              <rect x={x} y={H - h} width={barW} height={h} rx="1" fill={color} opacity={d.value ? 0.85 : 0.15} />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <div key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
            <div className="text-[10px] font-semibold text-[var(--text-primary)]">{d.value}{d.value ? suffix : ''}</div>
            <div className="text-[9px] text-[var(--text-tertiary)]">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-[var(--text-tertiary)] italic py-6 text-center">Aucune donnee disponible</p>;
}