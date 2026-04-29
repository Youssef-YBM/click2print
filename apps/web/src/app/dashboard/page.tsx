'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

const statusMap: Record<string, { label: string; color: string }> = {
  printing: { label: 'En impression', color: 'bg-blue-50 text-blue-700' },
  review: { label: 'Révision', color: 'bg-pink-50 text-pink-700' },
  done: { label: 'Terminé', color: 'bg-green-50 text-green-700' },
  shipped: { label: 'Expédié', color: 'bg-purple-50 text-purple-700' },
  pending: { label: 'En attente', color: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Annulé', color: 'bg-red-50 text-red-700' },
};

// Ajoutez cette ligne - URL dynamique selon l'environnement
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
    fetchOrders(token);
  }, []);

  const fetchOrders = async (token: string) => {
    try {
      const res = await fetch('/api/orders', {  // ← /api/ seulement
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      // Optionnel : afficher un message d'erreur à l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Commandes totales', value: orders.length },
    { label: 'En cours', value: orders.filter(o => o.status === 'printing').length },
    { label: 'Dépenses totales', value: `${orders.reduce((a, o) => a + (o.price || 0), 0)} MAD` },
    { label: 'En attente', value: orders.filter(o => o.status === 'pending').length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Bienvenue */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
            Bonjour, {user?.name || user?.username || 'Client'} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
            Voici un aperçu de vos commandes
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 14,
              border: '1px solid #f3f4f6', padding: '16px 18px',
            }}>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 600, color: '#111827', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Nouvelle commande CTA */}
        <div style={{
          background: '#10b981', borderRadius: 16,
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>
              Nouvelle commande
            </h2>
            <p style={{ fontSize: 13, color: '#d1fae5', margin: 0 }}>
              Uploadez votre fichier STL et obtenez un devis instantané
            </p>
          </div>
          <button
            onClick={() => router.push('/order')}
            style={{
              background: 'white', color: '#059669', fontWeight: 500,
              padding: '10px 20px', borderRadius: 12, border: 'none',
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Commander →
          </button>
        </div>

        {/* Commandes */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #f9fafb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Mes commandes</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{orders.length} commandes</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Chargement...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
                Aucune commande pour l'instant
              </div>
              <button
                onClick={() => router.push('/order')}
                style={{
                  background: '#10b981', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontSize: 14,
                  fontWeight: 500, cursor: 'pointer',
                }}
              >
                Passer ma première commande →
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['ID', 'Fichier', 'Matériau', 'Couleur', 'Qté', 'Prix', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 16px',
                      fontSize: 11, fontWeight: 500, color: '#9ca3af',
                      textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderTop: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 500 }}>
                      {o.id?.slice(0, 8).toUpperCase() || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{o.fileName || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{o.material || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{o.color || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{o.quantity || 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#374151' }}>
                      {o.price || 0} MAD
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                        background:
                          o.status === 'pending' ? '#fef3c7' :
                            o.status === 'printing' ? '#dbeafe' :
                              o.status === 'done' ? '#d1fae5' :
                                o.status === 'shipped' ? '#ede9fe' :
                                  o.status === 'cancelled' ? '#fee2e2' : '#fce7f3',
                        color:
                          o.status === 'pending' ? '#92400e' :
                            o.status === 'printing' ? '#1e40af' :
                              o.status === 'done' ? '#065f46' :
                                o.status === 'shipped' ? '#4c1d95' :
                                  o.status === 'cancelled' ? '#991b1b' : '#9d174d',
                      }}>
                        {statusMap[o.status]?.label || o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
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