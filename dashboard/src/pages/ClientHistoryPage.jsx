import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, visitsAPI } from '../services/api';
import {
  ArrowLeft, MapPin, Phone, User, Calendar, Clock,
  CheckCircle, AlertCircle, TrendingUp, Building2,
} from 'lucide-react';

const typeLabels = {
  pharmacy: { label: 'Pharmacie', color: '#059669' },
  hospital: { label: 'Hopital', color: '#dc2626' },
  doctor: { label: 'Medecin', color: '#d97706' },
  store: { label: 'Point de vente', color: '#7c3aed' },
  other: { label: 'Autre', color: '#6b7280' },
};

const statusLabels = {
  in_progress: 'En cours', completed: 'Terminee',
  too_short: 'Trop courte', too_long: 'Trop longue', cancelled: 'Annulee',
};

function fmtDur(s) {
  if (!s) return '-';
  const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function ClientHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      clientsAPI.get(id),
      visitsAPI.list({ client: id }),
    ])
      .then(([cRes, vRes]) => {
        setClient(cRes.data.client);
        setVisits(vRes.data.visits || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">Chargement...</div>;
  }
  if (!client) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-[var(--color-danger)]">Client introuvable</p>
        <button onClick={() => navigate('/clients')} className="tt-button-primary">Retour aux clients</button>
      </div>
    );
  }

  const completed = visits.filter((v) => v.status !== 'in_progress');
  const totalDuration = completed.reduce((s, v) => s + (v.durationSeconds || 0), 0);
  const avgDuration = completed.length ? Math.round(totalDuration / completed.length / 60) : 0;
  const lastVisit = visits[0];

  // Unique agents who visited
  const agentMap = {};
  visits.forEach((v) => {
    const aid = v.agent?._id || v.agent;
    if (!aid) return;
    if (!agentMap[aid]) {
      agentMap[aid] = { _id: aid, fullName: v.agent?.fullName || 'Agent', count: 0, lastVisit: v.enteredAt };
    }
    agentMap[aid].count += 1;
    if (new Date(v.enteredAt) > new Date(agentMap[aid].lastVisit)) {
      agentMap[aid].lastVisit = v.enteredAt;
    }
  });
  const agents = Object.values(agentMap).sort((a, b) => b.count - a.count);

  // Visits by month (last 6)
  const byMonth = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[k] = 0;
  }
  visits.forEach((v) => {
    const d = new Date(v.enteredAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (byMonth[k] !== undefined) byMonth[k] += 1;
  });
  const monthData = Object.entries(byMonth).map(([k, count]) => {
    const [, m] = k.split('-');
    const labels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { label: labels[parseInt(m, 10) - 1], count };
  });

  const type = typeLabels[client.type] || typeLabels.other;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-7 py-5 flex items-center gap-4"
        style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <ArrowLeft size={18} />
        </button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${type.color}1a`, border: `1px solid ${type.color}40` }}>
          <Building2 size={20} style={{ color: type.color }} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
            <span className="px-2 py-0.5 rounded font-medium" style={{ backgroundColor: `${type.color}1a`, color: type.color }}>
              {type.label}
            </span>
            {client.address && <span className="flex items-center gap-1"><MapPin size={12} /> {client.address}</span>}
            {client.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
          </div>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={CheckCircle} color="#059669" value={visits.length} label="Visites totales" />
          <Stat icon={Clock} color="#2563eb" value={`${avgDuration} min`} label="Duree moyenne" />
          <Stat icon={User} color="#7c3aed" value={agents.length} label="Agents differents" />
          <Stat icon={Calendar} color="#d97706"
            value={lastVisit ? new Date(lastVisit.enteredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-'}
            label="Derniere visite" />
        </div>

        {/* Visits per month chart + Top agents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Visites par mois</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-4">6 derniers mois</p>
            <BarChart data={monthData} color="#059669" />
          </div>

          <div className="tt-card p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Agents qui visitent ce client</h3>
            {agents.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] italic">Aucun agent</p>
            ) : (
              <div className="space-y-2">
                {agents.slice(0, 5).map((a) => {
                  const max = Math.max(...agents.map((x) => x.count), 1);
                  const pct = Math.round((a.count / max) * 100);
                  return (
                    <button key={a._id} onClick={() => navigate(`/agents/${a._id}`)}
                      className="w-full text-left">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-primary)] hover:underline font-medium">{a.fullName}</span>
                        <span className="text-[var(--text-tertiary)] font-mono">{a.count} visite(s)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#059669' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Full visit history */}
        <div className="tt-card overflow-hidden">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Historique des visites ({visits.length})</h3>
          </div>
          {visits.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-tertiary)] italic">
              <AlertCircle size={20} className="mx-auto mb-2 opacity-40" />
              Aucune visite enregistree pour ce client
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-base)' }}>
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Agent</th>
                  <th className="px-4 py-2 font-semibold">Entree</th>
                  <th className="px-4 py-2 font-semibold">Sortie</th>
                  <th className="px-4 py-2 font-semibold">Duree</th>
                  <th className="px-4 py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v, i) => (
                  <tr key={v._id} className="text-sm hover:bg-[var(--bg-hover)] transition"
                    style={{ borderBottom: i < visits.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] text-xs">
                      {new Date(v.enteredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => navigate(`/agents/${v.agent?._id || v.agent}`)}
                        className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:underline font-medium text-xs">
                        {v.agent?.fullName || 'Agent'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">
                      {new Date(v.enteredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">
                      {v.leftAt ? new Date(v.leftAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)] font-mono text-xs">{fmtDur(v.durationSeconds)}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{statusLabels[v.status] || v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, value, label }) {
  return (
    <div className="tt-card p-4">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}1a` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-xl font-bold text-[var(--text-primary)] leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1.5">{label}</div>
    </div>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 100, H = 60, gap = 3;
  const barW = (W - gap * (data.length - 1)) / data.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 12}`} style={{ width: '100%', height: '160px' }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.count / max) * H;
          return <rect key={i} x={i * (barW + gap)} y={H - h} width={barW} height={h} rx="1" fill={color} opacity={d.count ? 0.85 : 0.15} />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <div key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
            <div className="text-[10px] font-semibold text-[var(--text-primary)]">{d.count}</div>
            <div className="text-[9px] text-[var(--text-tertiary)]">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
