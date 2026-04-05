'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';

const STLViewer = dynamic(() => import('@/components/viewer/STLViewer'), { ssr: false });

const materials = ['PLA', 'PETG', 'ABS', 'Résine'];
const colors = ['Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge', 'Vert'];

const prices: Record<string, number> = {
  'PLA': 50, 'PETG': 70, 'ABS': 65, 'Résine': 120,
};

export default function OrderPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('Blanc');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const totalPrice = prices[material] * quantity;

  const handleFile = (f: File) => {
    if (f.name.toLowerCase().endsWith('.stl')) {
      setFile(f);
    } else {
      alert('Seuls les fichiers .STL sont acceptés');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

const handleSubmit = async () => {
  if (!file) return alert('Veuillez uploader un fichier STL');
  const token = localStorage.getItem('token');
  if (!token) return router.push('/login');
  setLoading(true);
  try {
    // 1 — Upload le fichier vers MinIO
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await fetch('http://localhost:3001/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!uploadRes.ok) throw new Error('Erreur upload fichier');
    const { fileName, url } = await uploadRes.json();

    // 2 — Créer la commande avec le fileUrl
    const orderRes = await fetch('http://localhost:3001/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileUrl: fileName,
        material,
        color,
        quantity,
        notes,
      }),
    });
    if (!orderRes.ok) throw new Error('Erreur commande');
    router.push('/dashboard');
  } catch (err) {
    alert('Erreur : ' + err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
            Nouvelle commande
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
            Uploadez votre fichier STL et configurez votre impression
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* Viewer */}
          <div style={{
            flexShrink: 0,
            width: '55%',
            background: 'white',
            borderRadius: 16,
            border: '1px solid #f3f4f6',
            padding: 16,
          }}>
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{
                  width: '100%',
                  height: '460px',
                  borderRadius: 12,
                  border: `2px dashed ${dragOver ? '#10b981' : '#e5e7eb'}`,
                  background: dragOver ? '#f0fdf4' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 52, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  Glissez votre fichier STL ici
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>ou cliquez pour parcourir</div>
                <input
                  id="file-input"
                  type="file"
                  accept=".stl"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <STLViewer file={file} material={material} />
            )}
          </div>

          {/* Config */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Fichier info */}
            {file && (
              <div style={{
                background: '#f0fdf4', borderRadius: 12,
                padding: '14px 16px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#065f46' }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  style={{ fontSize: 12, color: '#059669', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  Changer
                </button>
              </div>
            )}

            {/* Matériau */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Matériau
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {materials.map(m => (
                  <button key={m} onClick={() => setMaterial(m)} style={{
                    padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: material === m ? '1px solid #10b981' : '1px solid #e5e7eb',
                    background: material === m ? '#10b981' : 'white',
                    color: material === m ? 'white' : '#4b5563',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Couleur
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {colors.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    border: color === c ? '1px solid #10b981' : '1px solid #e5e7eb',
                    background: color === c ? '#10b981' : 'white',
                    color: color === c ? 'white' : '#4b5563',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Quantité
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', fontSize: 18, color: '#4b5563', cursor: 'pointer' }}
                >-</button>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#111827', minWidth: 24, textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', fontSize: 18, color: '#4b5563', cursor: 'pointer' }}
                >+</button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Instructions spéciales..."
                style={{
                  width: '100%', border: '1px solid #e5e7eb', borderRadius: 12,
                  padding: '12px 16px', fontSize: 13, resize: 'none',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Prix + Commander */}
            <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Prix estimé</span>
                <span style={{ fontSize: 24, fontWeight: 600, color: '#111827' }}>{totalPrice} MAD</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                {prices[material]} MAD × {quantity} pièce{quantity > 1 ? 's' : ''}
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                style={{
                  width: '100%',
                  background: loading || !file ? '#9ca3af' : '#10b981',
                  color: 'white', fontWeight: 500, padding: '12px 0',
                  borderRadius: 12, fontSize: 14, border: 'none',
                  cursor: loading || !file ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Commande en cours...' : `Commander pour ${totalPrice} MAD →`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}