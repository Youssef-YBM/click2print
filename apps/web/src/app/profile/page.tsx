'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Mon profil</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 32 }}>Gérez vos informations personnelles</p>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', padding: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#d1fae5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#059669',
          }}>
            {user.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>{user.name}</div>
            <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 2 }}>{user.email}</div>
            <span style={{
              display: 'inline-block', marginTop: 8,
              fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
              background: user.role === 'admin' ? '#ede9fe' : user.role === 'operator' ? '#dbeafe' : '#f0fdf4',
              color: user.role === 'admin' ? '#4c1d95' : user.role === 'operator' ? '#1e40af' : '#059669',
            }}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Infos */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 20 }}>Informations personnelles</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Nom complet</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            style={{
              marginTop: 20, background: saved ? '#059669' : '#10b981',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Mes statistiques</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { label: 'Commandes', value: '3' },
              { label: 'Dépenses', value: '370 MAD' },
              { label: 'Membre depuis', value: new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR') },
            ].map(s => (
              <div key={s.label} style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #fecaca', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>Zone dangereuse</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Ces actions sont irréversibles</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={logout}
              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Déconnexion
            </button>
            <button
              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}