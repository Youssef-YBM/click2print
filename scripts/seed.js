// scripts/seed.js
const { execSync } = require('child_process');

async function seed() {
  console.log('\n🌱 Exécution du seed...\n');
  
  try {
    // Vérifier si les tables existent
    const checkTables = execSync(
      'docker exec click2print-postgres-1 psql -U admin -d click2print -c "\\dt"',
      { encoding: 'utf8' }
    );
    
    if (checkTables.includes('user')) {
      console.log('✅ Les tables existent déjà');
      const answer = 'y'; // ou demander à l'utilisateur
      if (answer === 'y') {
        console.log('🔄 Reset de la base de données...');
        execSync('docker exec click2print-postgres-1 psql -U admin -d click2print -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"');
        console.log('✅ Base reset');
      }
    }
    
    // Lancer le seed TypeScript
    execSync('npx ts-node -r tsconfig-paths/register src/seed/seed.ts', { 
      cwd: './',
      stdio: 'inherit' 
    });
    
    console.log('\n🎉 Seed terminé avec succès !\n');
  } catch (error) {
    console.error('\n❌ Erreur seed:', error.message);
  }
}

seed();