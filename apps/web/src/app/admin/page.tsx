'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'En attente',    bg: '#fef3c7', color: '#92400e' },
  review:    { label: 'Révision',      bg: '#fce7f3', color: '#9d174d' },
  printing:  { label: 'En impression', bg: '#dbeafe', color: '#1e40af' },
  done:      { label: 'Terminé',       bg: '#d1fae5', color: '#065f46' },
  shipped:   { label: 'Expédié',       bg: '#ede9fe', color: '#4c1d95' },
  cancelled: { label: 'Annulé',        bg: '#fee2e2', color: '#991b1b' },
};

const statusOptions = [
  { value: 'pending',   label: 'En attente' },
  { value: 'review',    label: 'Révision' },
  { value: 'printing',  label: 'En impression' },
  { value: 'done',      label: 'Terminé' },
  { value: 'shipped',   label: 'Expédié' },
  { value: 'cancelled', label: 'Annulé' },
];

const navItems = [
  { id: 'dashboard', label: 'Dashboard',    icon: '▦' },
  { id: 'orders',    label: 'Commandes',    icon: '📋' },
  { id: 'users',     label: 'Utilisateurs', icon: '👥' },
  { id: 'machines',  label: 'Machines',     icon: '🖨️' },
  { id: 'assign',    label: 'Assignation',  icon: '🔧' },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: '', type: 'FDM', materials: 'PLA' });
  const [assignModal, setAssignModal] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
    fetchAll(token);
  }, []);

  const getToken = () => localStorage.getItem('token') || '';

  const fetchAll = async (token: string) => {
    await Promise.all([fetchOrders(token), fetchUsers(token), fetchMachines(token)]);
    setLoading(false);
  };

  const fetchOrders = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3001/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3001/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMachines = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3001/machines', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMachines(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`http://localhost:3001/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } finally { setUpdating(null); }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`http://localhost:3001/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
      }
    } catch (e) { console.error(e); }
  };

  const assignMachine = async (order: any, machineId: string) => {
    try {
      await fetch(`http://localhost:3001/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: 'printing' }),
      });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'printing', machineId } : o));
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, status: 'printing', currentJob: order.fileName, progress: 0 } : m));
    } catch (e) { console.error(e); }
    setAssignModal(null);
  };

const addMachine = async () => {
    if (!newMachine.name) return;
    try {
      const res = await fetch('http://localhost:3001/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newMachine.name, type: newMachine.type, materials: newMachine.materials.split(',').map((s: string) => s.trim()) }),
      });
      if (res.ok) {
        const created = await res.json();
        setMachines(prev => [created, ...prev]);
      }
    } catch (e) { console.error(e); }
    setNewMachine({ name: '', type: 'FDM', materials: 'PLA' });
    setShowAddMachine(false);
  };

  const deleteMachine = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/machines/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      setMachines(prev => prev.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  const logout = () => { localStorage.clear(); router.push('/login'); };

  const filteredOrders = orders.filter(o =>
    o.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total commandes', value: orders.length, color: '#10b981' },
    { label: 'En attente', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { label: 'En impression', value: orders.filter(o => o.status === 'printing').length, color: '#3b82f6' },
    { label: 'Terminées', value: orders.filter(o => ['done', 'shipped'].includes(o.status)).length, color: '#8b5cf6' },
  ];

  const S: any = {
    page: { display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' },
    sidebar: { width: 220, background: 'white', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topbar: { background: 'white', borderBottom: '1px solid #f3f4f6', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    content: { flex: 1, overflowY: 'auto', padding: 24 },
    card: { background: 'white', borderRadius: 14, border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: 20 },
    th: { textAlign: 'left' as const, padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase' as const, background: '#f9fafb' },
    td: { padding: '11px 16px', fontSize: 13, borderTop: '1px solid #f9fafb' },
    btn: { background: '#10b981', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    btnSm: { background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
    btnDanger: { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
    input: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  };

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#10b981', borderRadius: 8 }}></div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Click2Print</span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Panel Admin</div>
        </div>

        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: '100%', textAlign: 'left', padding: '9px 12px',
              borderRadius: 10, fontSize: 13, marginBottom: 2, border: 'none', cursor: 'pointer',
              background: activeTab === item.id ? '#f0fdf4' : 'transparent',
              color: activeTab === item.id ? '#059669' : '#6b7280',
              fontWeight: activeTab === item.id ? 500 : 400,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {item.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#10b981', color: 'white', fontSize: 10, padding: '1px 6px', borderRadius: 10 }}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#059669' }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer' }} onClick={() => router.push('/profile')}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Déconnexion</button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
            {navItems.find(n => n.id === activeTab)?.label}
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...S.input, width: 200 }} />
            <button onClick={() => router.push('/order')} style={S.btn}>+ Nouvelle commande</button>
          </div>
        </div>

        <div style={S.content}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                {stats.map(s => (
                  <div key={s.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #f3f4f6', padding: '16px 18px' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={S.card}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', fontWeight: 600, fontSize: 14, color: '#111827' }}>Commandes récentes</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['ID', 'Client', 'Fichier', 'Prix', 'Statut', 'Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                          <td style={{ ...S.td, color: '#10b981', fontWeight: 500 }}>{o.id.slice(0, 8).toUpperCase()}</td>
                          <td style={S.td}>{o.user?.name || 'N/A'}</td>
                          <td style={{ ...S.td, color: '#6b7280' }}>{o.fileName}</td>
                          <td style={{ ...S.td, fontWeight: 500 }}>{o.price} MAD</td>
                          <td style={S.td}>
                            <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: statusMap[o.status]?.bg, color: statusMap[o.status]?.color }}>
                              {statusMap[o.status]?.label}
                            </span>
                          </td>
                          <td style={S.td} onClick={e => e.stopPropagation()}>
                            <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} disabled={updating === o.id}
                              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12, background: 'white', cursor: 'pointer', outline: 'none' }}>
                              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={S.card}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', fontWeight: 600, fontSize: 14, color: '#111827' }}>Machines</div>
                  <div style={{ padding: 16 }}>
                    {machines.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>Aucune machine</div>}
                    {machines.map(m => (
                      <div key={m.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.status === 'printing' ? '#10b981' : m.status === 'error' ? '#ef4444' : '#d1d5db' }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{m.name}</span>
                          </div>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>{m.status === 'printing' ? `${m.progress}%` : m.status}</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: 4, height: 4 }}>
                          <div style={{ height: '100%', borderRadius: 4, width: `${m.progress}%`, background: m.status === 'error' ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* COMMANDES */}
          {activeTab === 'orders' && (
            <div style={S.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', fontWeight: 600, fontSize: 14, color: '#111827' }}>
                Toutes les commandes ({filteredOrders.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['ID', 'Client', 'Fichier', 'Matériau', 'Qté', 'Prix', 'Statut', 'Date', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ ...S.td, color: '#10b981', fontWeight: 500, cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>{o.id.slice(0, 8).toUpperCase()}</td>
                      <td style={S.td}>{o.user?.name || 'N/A'}</td>
                      <td style={{ ...S.td, color: '#6b7280' }}>{o.fileName}</td>
                      <td style={S.td}>{o.material}</td>
                      <td style={S.td}>{o.quantity}</td>
                      <td style={{ ...S.td, fontWeight: 500 }}>{o.price} MAD</td>
                      <td style={S.td}>
                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} disabled={updating === o.id}
                          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 12, background: 'white', cursor: 'pointer', outline: 'none' }}>
                          {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{ ...S.td, color: '#9ca3af' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setSelectedOrder(o)} style={S.btnSm}>Détails</button>
                          <button onClick={() => setAssignModal(o)} style={{ ...S.btnSm, background: '#eff6ff', color: '#1d4ed8' }}>Assigner</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* UTILISATEURS */}
          {activeTab === 'users' && (
            <div style={S.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', fontWeight: 600, fontSize: 14, color: '#111827' }}>
                Utilisateurs ({users.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['Nom', 'Email', 'Rôle', 'Commandes', 'Inscrit le', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#059669' }}>
                            {u.name?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 500, color: '#374151' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: '#6b7280' }}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: u.role === 'admin' ? '#ede9fe' : u.role === 'operator' ? '#dbeafe' : '#f0fdf4', color: u.role === 'admin' ? '#4c1d95' : u.role === 'operator' ? '#1e40af' : '#059669' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={S.td}>{orders.filter(o => o.user?.id === u.id).length}</td>
                      <td style={{ ...S.td, color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.role !== 'admin' && <button onClick={() => updateUserRole(u.id, 'admin')} style={{ ...S.btnSm, background: '#ede9fe', color: '#4c1d95' }}>→ Admin</button>}
                          {u.role !== 'operator' && <button onClick={() => updateUserRole(u.id, 'operator')} style={{ ...S.btnSm, background: '#dbeafe', color: '#1e40af' }}>→ Opérateur</button>}
                          {u.role !== 'client' && <button onClick={() => updateUserRole(u.id, 'client')} style={{ ...S.btnSm, background: '#f0fdf4', color: '#059669' }}>→ Client</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MACHINES */}
          {activeTab === 'machines' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => setShowAddMachine(true)} style={S.btn}>+ Ajouter une machine</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {machines.map(m => (
                  <div key={m.id} style={{ background: 'white', borderRadius: 14, border: `1px solid ${m.status === 'error' ? '#fecaca' : '#f3f4f6'}`, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.status === 'printing' ? '#10b981' : m.status === 'error' ? '#ef4444' : '#d1d5db' }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{m.name}</span>
                        </div>
                        <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 6 }}>{m.type}</span>
                      </div>
                      <button onClick={() => deleteMachine(m.id)} style={S.btnDanger}>✕</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}><strong>Job :</strong> {m.currentJob || 'Disponible'}</div>
                    <div style={{ background: '#f3f4f6', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 6, width: `${m.progress}%`, background: m.status === 'error' ? '#ef4444' : '#10b981', transition: 'width 0.3s' }} />
                    </div>
                    {m.status === 'printing' && <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginBottom: 8 }}>{m.progress}%</div>}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Matériaux</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(m.materials || []).map((mat: string) => (
                          <span key={mat} style={{ fontSize: 11, background: '#f0fdf4', color: '#059669', padding: '2px 8px', borderRadius: 6 }}>{mat}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {machines.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                    Aucune machine — ajoutez-en une !
                  </div>
                )}
              </div>
            </>
          )}

          {/* ASSIGNATION */}
          {activeTab === 'assign' && (
            <div style={S.card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f9fafb', fontWeight: 600, fontSize: 14, color: '#111827' }}>
                Commandes à assigner
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{['ID', 'Client', 'Fichier', 'Matériau', 'Prix', 'Machine', 'Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.filter(o => o.status === 'pending' || o.status === 'review').map(o => (
                    <tr key={o.id}>
                      <td style={{ ...S.td, color: '#10b981', fontWeight: 500 }}>{o.id.slice(0, 8).toUpperCase()}</td>
                      <td style={S.td}>{o.user?.name || 'N/A'}</td>
                      <td style={{ ...S.td, color: '#6b7280' }}>{o.fileName}</td>
                      <td style={S.td}>{o.material}</td>
                      <td style={{ ...S.td, fontWeight: 500 }}>{o.price} MAD</td>
                      <td style={S.td}>
                        {o.machineId
                          ? <span style={{ color: '#059669', fontWeight: 500 }}>{machines.find(m => m.id === o.machineId)?.name}</span>
                          : <span style={{ color: '#9ca3af' }}>Non assignée</span>}
                      </td>
                      <td style={S.td}>
                        <select defaultValue="" onChange={e => e.target.value && assignMachine(o, e.target.value)}
                          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 12, background: 'white', cursor: 'pointer', outline: 'none' }}>
                          <option value="">Choisir une machine...</option>
                          {machines.filter(m => m.status === 'idle').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.filter(o => o.status === 'pending' || o.status === 'review').length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Aucune commande en attente</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Modal détail commande */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setSelectedOrder(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 440, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Commande {selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>
            {[
              { label: 'Client', value: selectedOrder.user?.name },
              { label: 'Email', value: selectedOrder.user?.email },
              { label: 'Fichier', value: selectedOrder.fileName },
              { label: 'Matériau', value: selectedOrder.material },
              { label: 'Couleur', value: selectedOrder.color },
              { label: 'Quantité', value: selectedOrder.quantity },
              { label: 'Prix', value: `${selectedOrder.price} MAD` },
              { label: 'Notes', value: selectedOrder.notes || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span style={{ color: '#9ca3af' }}>{row.label}</span>
                <span style={{ color: '#374151', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>Changer le statut</label>
              <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }}>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button onClick={() => setSelectedOrder(null)} style={{ ...S.btn, width: '100%', marginTop: 16, padding: '11px 0', fontSize: 14 }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Modal assigner machine */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setAssignModal(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Assigner une machine</h2>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Commande : <strong>{assignModal.fileName}</strong> — {assignModal.material}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {machines.filter(m => m.status === 'idle').map(m => (
                <button key={m.id} onClick={() => assignMachine(assignModal, m.id)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', background: 'white', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#111827', marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{m.type} · {(m.materials || []).join(', ')}</div>
                </button>
              ))}
              {machines.filter(m => m.status === 'idle').length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 20 }}>Aucune machine disponible</div>
              )}
            </div>
            <button onClick={() => setAssignModal(null)} style={{ ...S.btnSm, width: '100%', marginTop: 16, padding: '10px 0', fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal ajouter machine */}
      {showAddMachine && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setShowAddMachine(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Ajouter une machine</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Nom</label>
                <input value={newMachine.name} onChange={e => setNewMachine({ ...newMachine, name: e.target.value })} placeholder="ex: Bambu X1 #06" style={S.input} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Type</label>
                <select value={newMachine.type} onChange={e => setNewMachine({ ...newMachine, type: e.target.value })} style={S.input}>
                  <option value="FDM">FDM</option>
                  <option value="SLA">SLA (Résine)</option>
                  <option value="SLS">SLS</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Matériaux (séparés par virgule)</label>
                <input value={newMachine.materials} onChange={e => setNewMachine({ ...newMachine, materials: e.target.value })} placeholder="PLA, PETG, ABS" style={S.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddMachine(false)} style={{ ...S.btnSm, flex: 1, padding: '10px 0' }}>Annuler</button>
              <button onClick={addMachine} disabled={!newMachine.name} style={{ ...S.btn, flex: 2, padding: '10px 0' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}