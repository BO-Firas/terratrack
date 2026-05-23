import { useEffect, useState } from 'react';
import { usersAPI, zonesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import {
  UserPlus, Pencil, Power, Trash2, X, KeyRound, Shield, Eye, EyeOff,
} from 'lucide-react';

const roleLabels = {
  admin: { label: 'Administrateur', color: '#8b5cf6' },
  supervisor: { label: 'Superviseur', color: '#3b82f6' },
  agent: { label: 'Agent', color: '#10b981' },
};

const emptyForm = {
  fullName: '', email: '', password: '', role: 'agent', phone: '', assignedZones: [], dailyTarget: 0,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwModalId, setPwModalId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  function load() {
    setLoading(true);
    Promise.all([usersAPI.list(), zonesAPI.list()])
      .then(([uRes, zRes]) => {
        setUsers(uRes.data.users);
        setZones(zRes.data.zones);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowPassword(false);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditingId(user._id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      assignedZones: (user.assignedZones || []).map((z) => z._id),
      dailyTarget: user.dailyTarget || 0,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit() {
    setError('');
    if (!form.fullName || !form.email || (!editingId && !form.password) || !form.role) {
      setError('Merci de remplir tous les champs obligatoires.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          fullName: form.fullName, email: form.email, phone: form.phone,
          role: form.role, assignedZones: form.role === 'agent' ? form.assignedZones : [],
          dailyTarget: form.role === 'agent' ? Number(form.dailyTarget) || 0 : 0,
        };
        await usersAPI.update(editingId, payload);
      } else {
        await usersAPI.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(user) {
    try {
      await usersAPI.toggle(user._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Supprimer definitivement ${user.fullName} ?`)) return;
    try {
      await usersAPI.remove(user._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    try {
      await usersAPI.resetPassword(pwModalId, newPassword);
      setPwModalId(null);
      setNewPassword('');
      alert('Mot de passe reinitialise');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users.length} utilisateur${users.length > 1 ? 's' : ''} • Administration`}
      >
        <button onClick={openCreate} className="tt-button-primary flex items-center gap-2">
          <UserPlus size={16} />
          Ajouter
        </button>
      </PageHeader>

      <div className="p-7">
        {loading ? (
          <div className="text-center text-[var(--text-tertiary)] py-12">Chargement...</div>
        ) : (
          <div className="tt-card overflow-hidden">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Zones</th>
                  <th className="px-4 py-3 font-semibold">Etat</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const roleInfo = roleLabels[user.role] || roleLabels.agent;
                  return (
                    <tr key={user._id} className="text-sm hover:bg-[var(--bg-overlay)] transition"
                      style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{user.fullName}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider"
                          style={{ backgroundColor: `${roleInfo.color}22`, color: roleInfo.color, border: `1px solid ${roleInfo.color}44` }}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(user.assignedZones || []).map((z) => (
                            <span key={z._id} className="text-[10px] px-2 py-0.5 rounded"
                              style={{ backgroundColor: `${z.color}22`, color: z.color }}>{z.name}</span>
                          ))}
                          {user.role !== 'agent' && <span className="text-[var(--text-tertiary)] text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.isActive ? 'var(--color-success)' : 'var(--text-tertiary)' }} />
                          {user.isActive ? 'Actif' : 'Desactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="Modifier" onClick={() => openEdit(user)}><Pencil size={15} /></IconBtn>
                          <IconBtn title="Mot de passe" onClick={() => { setPwModalId(user._id); setNewPassword(''); }}><KeyRound size={15} /></IconBtn>
                          <IconBtn title={user.isActive ? 'Desactiver' : 'Activer'} onClick={() => handleToggle(user)}><Power size={15} /></IconBtn>
                          <IconBtn title="Supprimer" danger onClick={() => handleDelete(user)}><Trash2 size={15} /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal creation / edition */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title={editingId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} icon={editingId ? Pencil : UserPlus}>
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>{error}</div>
          )}
          <Field label="Nom complet *">
            <input className="tt-input w-full" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Ex : Ahmed Ben Ali" />
          </Field>
          <Field label="Email *">
            <input className="tt-input w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmed@terratrack.tn" />
          </Field>
          {!editingId && (
            <Field label="Mot de passe *">
              <div className="relative">
                <input className="tt-input w-full pr-10" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          )}
          <Field label="Telephone">
            <input className="tt-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+216 ..." />
          </Field>
          <Field label="Role *">
            <div className="flex gap-2">
              {Object.entries(roleLabels).map(([key, info]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, role: key })}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition"
                  style={{
                    backgroundColor: form.role === key ? `${info.color}22` : 'var(--bg-base)',
                    color: form.role === key ? info.color : 'var(--text-secondary)',
                    border: `1px solid ${form.role === key ? `${info.color}66` : 'var(--border-subtle)'}`,
                  }}>{info.label}</button>
              ))}
            </div>
          </Field>
          {form.role === 'agent' && (
            <Field label="Zones assignees">
              <div className="flex flex-wrap gap-2">
                {zones.map((z) => {
                  const selected = form.assignedZones.includes(z._id);
                  return (
                    <button key={z._id} type="button"
                      onClick={() => setForm({ ...form, assignedZones: selected ? form.assignedZones.filter((id) => id !== z._id) : [...form.assignedZones, z._id] })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{
                        backgroundColor: selected ? `${z.color}22` : 'var(--bg-base)',
                        color: selected ? z.color : 'var(--text-secondary)',
                        border: `1px solid ${selected ? `${z.color}66` : 'var(--border-subtle)'}`,
                      }}>{z.name}</button>
                  );
                })}
              </div>
            </Field>
          )}
          {form.role === 'agent' && (
            <Field label="Objectif quotidien (nombre de visites)">
              <input
                type="number"
                min="0"
                className="tt-input w-full"
                value={form.dailyTarget}
                onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
                placeholder="0 = aucun objectif"
              />
            </Field>
          )}
          <div className="flex gap-2 mt-6">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} className="tt-button-primary flex-1">{saving ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Creer')}</button>
          </div>
        </Modal>
      )}

      {/* Modal reset password */}
      {pwModalId && (
        <Modal onClose={() => setPwModalId(null)} title="Reinitialiser le mot de passe" icon={KeyRound}>
          <Field label="Nouveau mot de passe">
            <input className="tt-input w-full" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 caracteres" />
          </Field>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setPwModalId(null)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>Annuler</button>
            <button onClick={handleResetPassword} className="tt-button-primary flex-1">Reinitialiser</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title}
      className="p-2 rounded-lg transition"
      style={{ color: danger ? 'var(--color-danger)' : 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ children, onClose, title, icon: Icon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full max-w-md fade-in" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-[var(--accent-primary)]" />}
            <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}