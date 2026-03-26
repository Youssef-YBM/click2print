'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const router = useRouter();
  const { user, logout, isAdmin, isOperator } = useAuth();

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #f3f4f6',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => router.push('/dashboard')}
      >
        <div style={{ width: 28, height: 28, background: '#10b981', borderRadius: 8 }}></div>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Click2Print</span>
      </div>

      {/* Navigation links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavBtn label="Dashboard" onClick={() => router.push('/dashboard')} />
        <NavBtn label="Commander" onClick={() => router.push('/order')} highlight />
        {(isAdmin || isOperator) && (
          <NavBtn label="Panel Admin" onClick={() => router.push('/admin')} admin />
        )}
      </div>

      {/* User menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Switch profil */}
        {(isAdmin || isOperator) && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 10, padding: '3px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, border: 'none',
                background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500,
              }}
            >
              👤 Client
            </button>
            <button
              onClick={() => router.push('/admin')}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, border: 'none',
                background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 500,
              }}
            >
              ⚙️ Admin
            </button>
          </div>
        )}

        {/* Role badge */}
        <span style={{
          fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
          background: isAdmin ? '#ede9fe' : isOperator ? '#dbeafe' : '#f0fdf4',
          color: isAdmin ? '#4c1d95' : isOperator ? '#1e40af' : '#059669',
        }}>
          {user?.role}
        </span>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#d1fae5', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: '#059669',
        }}>
          {user?.name?.charAt(0)}
        </div>

        <span
  style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer' }}
  onClick={() => router.push('/profile')}
>
  {user?.name}
</span>

        <button
          onClick={logout}
          style={{
            fontSize: 12, color: '#9ca3af', background: 'none',
            border: '1px solid #e5e7eb', borderRadius: 8,
            padding: '5px 10px', cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

function NavBtn({ label, onClick, highlight, admin }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 10, fontSize: 13, border: 'none',
        cursor: 'pointer', fontWeight: highlight || admin ? 500 : 400,
        background: highlight ? '#10b981' : admin ? '#ede9fe' : 'transparent',
        color: highlight ? 'white' : admin ? '#4c1d95' : '#6b7280',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}