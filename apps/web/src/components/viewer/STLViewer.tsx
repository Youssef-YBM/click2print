'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface STLViewerProps {
  file: File | null;
  material?: string;
}

const materialColors: Record<string, string> = {
  'PLA':    '#e8e8e8',
  'PETG':   '#a8d8ea',
  'ABS':    '#f0c080',
  'Résine': '#c8a8e8',
};

export default function STLViewer({ file, material = 'PLA' }: STLViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const [info, setInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const W = mountRef.current.clientWidth || 500;
    const H = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f1f5f9');

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 10000);
    camera.position.set(100, 80, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1);
    dir1.position.set(100, 100, 100);
    dir1.castShadow = true;
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-100, -50, -100);
    scene.add(dir2);

    const grid = new THREE.GridHelper(300, 30, 0xcccccc, 0xdddddd);
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener('resize', handleResize);

    if (file) {
      setLoading(true);
      setInfo('');
      const loader = new STLLoader();
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const geometry = loader.parse(buffer);
          geometry.computeBoundingBox();
          const box = geometry.boundingBox!;
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          geometry.translate(-center.x, -center.y, -center.z);
          const s = 60 / maxDim;
          geometry.scale(s, s, s);
          const matColor = materialColors[material] || '#cccccc';
          const mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(matColor),
            specular: new THREE.Color('#444444'),
            shininess: 80,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geometry, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          const dist = 60 * 1.8;
          camera.position.set(dist, dist * 0.8, dist);
          camera.lookAt(0, 0, 0);
          controls.target.set(0, 0, 0);
          controls.update();
          const triangles = geometry.attributes.position.count / 3;
          setInfo(
            `${Math.round(triangles).toLocaleString()} triangles · ` +
            `${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)} mm`
          );
          setLoading(false);
        } catch {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [file, material]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px' }}>
      <div
        ref={mountRef}
        style={{ width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden' }}
      />

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)', borderRadius: '12px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid #10b981',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 10px',
            }} />
            <div style={{ fontSize: 14, color: '#6b7280' }}>Chargement du modèle...</div>
          </div>
        </div>
      )}

      {!file && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14 }}>Uploadez un fichier STL pour prévisualiser</div>
          </div>
        </div>
      )}

      {info && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 10, padding: '6px 12px',
          fontSize: 12, color: '#6b7280',
          border: '1px solid #e5e7eb',
        }}>
          {info}
        </div>
      )}

      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 10, padding: '4px 10px',
        fontSize: 11, color: '#9ca3af',
        border: '1px solid #e5e7eb',
      }}>
        Drag pour tourner · Scroll pour zoomer
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}