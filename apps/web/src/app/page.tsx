import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
          <span className="font-semibold text-gray-900 text-lg">Click2Print</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">Connexion</Link>
          <Link href="/register" className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors">
            Commencer →
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          Service d'impression 3D professionnel au Maroc
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Imprimez en 3D,<br />
          <span className="text-emerald-500">livré chez vous</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          Uploadez votre fichier STL, configurez vos options, obtenez un devis instantané et recevez votre pièce imprimée en quelques jours.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="bg-emerald-500 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-emerald-600 transition-colors text-sm">
            Démarrer gratuitement →
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-600 font-medium px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Se connecter
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-20">
          {[
            { title: 'Upload STL', desc: 'Glissez votre fichier et prévisualisez en 3D instantanément' },
            { title: 'Devis instantané', desc: 'Prix calculé automatiquement selon matériau et volume' },
            { title: 'Livraison rapide', desc: 'Impression et livraison en 3 à 5 jours ouvrables' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 text-left">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg mb-4"></div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}