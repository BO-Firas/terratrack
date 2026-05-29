import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI, zonesAPI } from '../services/api';
import PageHeader from '../components/PageHeader';
import { Plus, Pencil, Trash2, X, MapPin, Building2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let googleMapsPromise = null;
function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Echec chargement Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

const typeLabels = {
  pharmacy: { label: 'Pharmacie', color: '#059669' },
  hospital: { label: 'Hopital', color: '#dc2626' },
  doctor: { label: 'Medecin', color: '#d97706' },
  store: { label: 'Point de vente', color: '#7c3aed' },
  other: { label: 'Autre', color: '#6b7280' },
};

const emptyForm = {
  name: '', type: 'pharmacy', address: '', phone: '', contactPerson: '',
  latitude: 33.8881, longitude: 10.0982, geofenceRadius: 40, zone: '',
  expectedMin: 5, expectedMax: 60,
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    Promise.all([clientsAPI.list(), zonesAPI.list()])
      .then(([cRes, zRes]) => {
        setClients(cRes.data.clients);
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
    setModalOpen(true);
  }
  function openEdit(client) {
    const [lng, lat] = client.location.coordinates;
    setEditingId(client._id);
    setForm({
      name: client.name, type: client.type, address: client.address || '',
      phone: client.phone || '', contactPerson: client.contactPerson || '',
      latitude: lat, longitude: lng, geofenceRadius: client.geofenceRadius || 40,
      zone: client.zone?._id || client.zone || '',
      expectedMin: client.expectedVisitDuration?.min || 5,
      expectedMax: client.expectedVisitDuration?.max || 60,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit() {
    setError('');
    if (!form.name || !form.type) { setError('Nom et type obligatoires.'); return; }
    setSaving(true);
    const payload = {
      name: form.name, type: form.type, address: form.address,
      phone: form.phone, contactPerson: form.contactPerson,
      longitude: Number(form.longitude), latitude: Number(form.latitude),
      geofenceRadius: Number(form.geofenceRadius), zone: form.zone || undefined,
      expectedVisitDuration: { min: Number(form.expectedMin), max: Number(form.expectedMax) },
    };
    try {
      if (editingId) await clientsAPI.update(editingId, payload);
      else await clientsAPI.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(`Desactiver "${client.name}" ?`)) return;
    try { await clientsAPI.remove(client._id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  }

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Clients" subtitle={`${clients.length} clients • Administration`}>
        <button onClick={openCreate} className="tt-button-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter un client
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
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Adresse</th>
                  <th className="px-4 py-3 font-semibold">Rayon</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => {
                  const t = typeLabels[client.type] || typeLabels.other;
                  return (
                    <tr key={client._id}
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        navigate(`/clients/${client._id}`);
                      }}
                      className="text-sm hover:bg-[var(--bg-hover)] transition"
                      style={{ cursor: 'pointer', borderBottom: i < clients.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{client.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider"
                          style={{ backgroundColor: `${t.color}1a`, color: t.color, border: `1px solid ${t.color}40` }}>
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{client.address || '-'}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs">{client.geofenceRadius} m</td>
                      <td className="px-4 py-3">
                        {client.zone && (
                          <span className="text-[10px] px-2 py-1 rounded-md font-medium"
                            style={{ backgroundColor: `${client.zone.color}1a`, color: client.zone.color, border: `1px solid ${client.zone.color}40` }}>
                            {client.zone.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="Modifier" onClick={() => openEdit(client)}><Pencil size={15} /></IconBtn>
                          <IconBtn title="Desactiver" danger onClick={() => handleDelete(client)}><Trash2 size={15} /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {clients.length === 0 && (
              <div className="text-center text-[var(--text-tertiary)] py-12">Aucun client. Cliquez "Ajouter un client".</div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <ClientModal
          form={form} setForm={setForm} zones={zones} error={error} saving={saving}
          editingId={editingId} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ClientModal({ form, setForm, zones, error, saving, editingId, onClose, onSubmit }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((google) => {
      if (cancelled || !mapRef.current) return;
      const center = { lat: Number(form.latitude), lng: Number(form.longitude) };
      const map = new google.maps.Map(mapRef.current, {
        center, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      mapObj.current = map;

      const marker = new google.maps.Marker({
        position: center, map, draggable: true,
      });
      markerRef.current = marker;

      const circle = new google.maps.Circle({
        center, radius: Number(form.geofenceRadius), map,
        strokeColor: '#dc2626', strokeOpacity: 0.6, strokeWeight: 1,
        fillColor: '#dc2626', fillOpacity: 0.12,
      });
      circleRef.current = circle;

      function updatePos(latLng) {
        marker.setPosition(latLng);
        circle.setCenter(latLng);
        setForm((f) => ({ ...f, latitude: latLng.lat(), longitude: latLng.lng() }));
      }
      map.addListener('click', (e) => updatePos(e.latLng));
      marker.addListener('dragend', (e) => updatePos(e.latLng));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre a jour le rayon du cercle quand le slider change
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(Number(form.geofenceRadius));
  }, [form.geofenceRadius]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full max-w-3xl fade-in" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[var(--accent-primary)]" />
            <h2 className="font-semibold text-[var(--text-primary)]">{editingId ? 'Modifier le client' : 'Nouveau client'}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626' }}>{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Field label="Nom *">
              <input className="tt-input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Pharmacie Centrale" />
            </Field>
            <Field label="Type *">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(typeLabels).map(([key, info]) => (
                  <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{
                      backgroundColor: form.type === key ? `${info.color}1a` : 'var(--bg-base)',
                      color: form.type === key ? info.color : 'var(--text-secondary)',
                      border: `1px solid ${form.type === key ? `${info.color}66` : 'var(--border-subtle)'}`,
                    }}>{info.label}</button>
                ))}
              </div>
            </Field>
            <Field label="Adresse">
              <input className="tt-input w-full" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Avenue Farhat Hached" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Telephone">
                <input className="tt-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+216..." />
              </Field>
              <Field label="Contact">
                <input className="tt-input w-full" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Dr. ..." />
              </Field>
            </div>
            <Field label="Zone">
              <select className="tt-input w-full" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
                <option value="">— Aucune —</option>
                {zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="Position (cliquez ou glissez le marqueur)">
              <div ref={mapRef} style={{ width: '100%', height: '220px', borderRadius: '10px', border: '1px solid var(--border-default)' }} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <input className="tt-input w-full font-mono text-xs" value={Number(form.latitude).toFixed(6)} readOnly />
              </Field>
              <Field label="Longitude">
                <input className="tt-input w-full font-mono text-xs" value={Number(form.longitude).toFixed(6)} readOnly />
              </Field>
            </div>
            <Field label={`Rayon du geofence : ${form.geofenceRadius} metres`}>
              <input type="range" min="10" max="200" step="5" value={form.geofenceRadius}
                onChange={(e) => setForm({ ...form, geofenceRadius: e.target.value })}
                className="w-full accent-[var(--accent-primary)]" />
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-1">
                <span>10 m</span><span>200 m</span>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Duree min (min)">
                <input type="number" className="tt-input w-full" value={form.expectedMin} onChange={(e) => setForm({ ...form, expectedMin: e.target.value })} />
              </Field>
              <Field label="Duree max (min)">
                <input type="number" className="tt-input w-full" value={form.expectedMax} onChange={(e) => setForm({ ...form, expectedMax: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>Annuler</button>
          <button onClick={onSubmit} disabled={saving} className="tt-button-primary flex-1">{saving ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Creer le client')}</button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-lg transition"
      style={{ color: danger ? 'var(--color-danger)' : 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  );
}