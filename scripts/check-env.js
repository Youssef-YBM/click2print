const fs = require('fs');
const path = require('path');

const envFiles = [
  { path: 'apps/api/.env', content: `# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secret
DB_NAME=click2print

# JWT
JWT_SECRET=super_secret_key_click2print_2025
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
` },
  { path: 'apps/web/.env.local', content: `NEXT_PUBLIC_API_URL=http://localhost:3001
` }
];

envFiles.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.content);
    console.log(`✅ Créé: ${file.path}`);
  }
});