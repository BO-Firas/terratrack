import { useEffect, useState } from 'react';
import { agentsAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { MapPin, Phone, Mail, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    agentsAPI
      .list()
      .then((res) => setAgents(res.data.agents))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  function formatLastSeen(date) {
    if (!date) return null;
    const diff = (Date.now() - new Date(date)) / 1000 / 60;
    if (diff < 1) return "A l'instant";
    if (diff < 60) return `Il y a ${Math.round(diff)} min`;
    if (diff < 1440) return `Il y a ${Math.round(diff / 60)}h`;
    return new Date(date).toLocaleDateString('fr-FR');
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Agents"
        subtitle={`${agents.length} agent${agents.length > 1 ? 's' : ''} • TerraTrack Gabes`}
      />

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const lastSeen = formatLastSeen(agent.lastKnownLocation?.updatedAt);
              const online = lastSeen && lastSeen.includes('instant') || lastSeen?.includes('min');

              return (
                <div
                  key={agent._id}
                  onClick={() => navigate(`/agents/${agent._id}`)}
                  className="tt-card tt-card-hover p-5 fade-in"
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-base flex-shrink-0"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--accent-primary), #34d399)',
                        color: '#052e1c',
                      }}
                    >
                      {agent.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {agent.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            online ? 'pulse-dot' : ''
                          }`}
                          style={{
                            backgroundColor: online
                              ? 'var(--color-success)'
                              : 'var(--text-tertiary)',
                          }}
                        />
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                          {online ? 'En ligne' : agent.isActive ? 'Hors ligne' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-[var(--text-tertiary)]" />
                      <span className="truncate font-mono">{agent.email}</span>
                    </div>
                    {agent.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[var(--text-tertiary)]" />
                        <span className="font-mono">{agent.phone}</span>
                      </div>
                    )}
                    {lastSeen && (
                      <div className="flex items-center gap-2">
                        <Activity size={13} className="text-[var(--text-tertiary)]" />
                        <span>{lastSeen}</span>
                      </div>
                    )}
                  </div>

                  {agent.assignedZones?.length > 0 && (
                    <div
                      className="mt-4 pt-4"
                      style={{ borderTop: '1px solid var(--border-subtle)' }}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                        Zones assignees
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.assignedZones.map((zone) => (
                          <span
                            key={zone._id}
                            className="text-[10px] px-2 py-1 rounded-md font-medium"
                            style={{
                              backgroundColor: `${zone.color}22`,
                              color: zone.color,
                              border: `1px solid ${zone.color}44`,
                            }}
                          >
                            {zone.name}
                          </span>
                        ))}
                      </div>
                    </div>
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
