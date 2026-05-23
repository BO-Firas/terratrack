import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('supervisor@terratrack.tn');
  const [password, setPassword] = useState('super123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/map" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === 'agent') {
        setError(
          "Le tableau de bord est reserve aux superviseurs et administrateurs"
        );
        setLoading(false);
        return;
      }
      navigate('/map');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Erreur de connexion - verifiez vos identifiants'
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Gradient mesh background - effet d'atmosphere */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 20% 30%, rgba(16, 185, 129, 0.12), transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.08), transparent 50%)',
        }}
      />

      {/* Grid pattern subtil */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div
        className="relative w-full max-w-md fade-in"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5 text-[var(--accent-primary)]">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TerraTrack</h1>
          <p
            className="text-xs uppercase tracking-[0.2em] mt-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Field Operations Console
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="mb-5 p-3 rounded-lg flex items-start gap-2"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle
              size={16}
              className="flex-shrink-0 mt-0.5"
              style={{ color: 'var(--color-danger)' }}
            />
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tt-input w-full"
              placeholder="vous@terratrack.tn"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tt-input w-full"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="tt-button-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Connexion...</span>
            ) : (
              <>
                <span>Acceder au tableau de bord</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Comptes demo */}
        <div
          className="mt-6 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Comptes de demonstration
          </p>
          <div className="space-y-1 text-xs font-mono">
            <div
              className="flex justify-between"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>admin@terratrack.tn</span>
              <span style={{ color: 'var(--text-tertiary)' }}>admin123</span>
            </div>
            <div
              className="flex justify-between"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>super@terratrack.tn</span>
              <span style={{ color: 'var(--text-tertiary)' }}>super123</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="mt-6 text-center text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)' }}
        >
          PFE 2026 · Gabes, Tunisie
        </div>
      </div>
    </div>
  );
}
