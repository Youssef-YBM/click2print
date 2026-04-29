#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const logSuccess = (msg) => log(`✅ ${msg}`, 'green');
const logStep = (msg) => log(`\n🔹 ${msg}`, 'yellow');
const logError = (msg) => log(`❌ ${msg}`, 'red');

// Démarrer Docker
const startDocker = () => {
  return new Promise((resolve) => {
    logStep('Démarrage des conteneurs Docker...');
    const docker = spawn('docker', ['compose', 'up', '-d'], { shell: true, stdio: 'inherit' });
    docker.on('exit', (code) => {
      if (code === 0) logSuccess('Conteneurs Docker démarrés');
      resolve();
    });
  });
};

// Attendre PostgreSQL
const waitForPostgres = () => {
  return new Promise((resolve) => {
    logStep('Attente de PostgreSQL...');
    let attempts = 0;
    const check = () => {
      exec('docker exec click2print-postgres-1 pg_isready -U admin', (err) => {
        if (!err) {
          logSuccess('PostgreSQL est prêt');
          resolve();
        } else if (attempts++ > 15) {
          logError('Timeout PostgreSQL');
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
};

// Lancer le seed
const runSeed = () => {
  return new Promise((resolve) => {
    logStep('Exécution du seed...');
    const seed = spawn('npm', ['run', 'seed'], {
      shell: true,
      stdio: 'inherit',
      cwd: './apps/api'  // ← Important : lance depuis apps/api
    });
    seed.on('exit', (code) => {
      if (code === 0) logSuccess('Seed exécuté');
      else logError('Seed échoué');
      resolve();
    });
  });
};

// Lancer l'API
const startAPI = () => {
  logStep('Démarrage de l\'API NestJS...');
  const api = spawn('npm', ['run', 'dev'], {  // ← "dev" au lieu de "start:dev"
    cwd: './apps/api',
    shell: true,
    stdio: 'pipe'
  });
  
  api.stdout.on('data', (data) => {
    const out = data.toString();
    console.log(`\x1b[36m[API]\x1b[0m ${out.trim()}`);
    if (out.includes('Application is running') || out.includes('Nest application successfully started')) {
      logSuccess('API démarrée sur http://localhost:3001');
    }
  });
  api.stderr.on('data', (data) => console.log(`\x1b[31m[API]\x1b[0m ${data.toString().trim()}`));
};

// Lancer le Web
const startWeb = () => {
  logStep('Démarrage de Next.js...');
  const web = spawn('npm', ['run', 'dev'], {
    cwd: './apps/web',
    shell: true,
    stdio: 'pipe'
  });
  
  web.stdout.on('data', (data) => {
    const out = data.toString();
    console.log(`\x1b[32m[WEB]\x1b[0m ${out.trim()}`);
    if (out.includes('ready') || out.includes('started')) {
      logSuccess('Next.js démarré sur http://localhost:3000');
    }
  });
  web.stderr.on('data', (data) => console.log(`\x1b[31m[WEB]\x1b[0m ${data.toString().trim()}`));
};

// Afficher les URLs
const showUrls = () => {
  console.log('\n' + '='.repeat(50));
  log('🎉 SERVICES DÉMARRÉS !', 'cyan');
  console.log('='.repeat(50));
  console.log('\n🔗 Liens :\n');
  console.log(`   📡 API      : http://localhost:3001`);
  console.log(`   🗄️  MinIO    : http://localhost:9001 (minioadmin/minioadmin)`);
  console.log(`   🌐 Web      : http://localhost:3000`);
  console.log('\n👤 Comptes de test :');
  console.log(`   Admin : admin@click2print.com / admin123`);
  console.log(`   User  : user@example.com / password123`);
  console.log('\n' + '='.repeat(50));
  log('💡 Ctrl+C pour arrêter', 'gray');
  console.log('='.repeat(50) + '\n');
};

// Nettoyage
const cleanup = () => {
  console.log('\n🛑 Arrêt des services...');
  exec('docker compose down', () => process.exit(0));
};

// Main
async function main() {
  console.clear();
  console.log('='.repeat(50));
  log('🖨️  CLICK2PRINT - DÉMARRAGE', 'cyan');
  console.log('='.repeat(50));
  
  await startDocker();
  await waitForPostgres();
  await runSeed();
  
  startAPI();
  startWeb();
  
  setTimeout(showUrls, 3000);
  
  process.on('SIGINT', cleanup);
}

main();