import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS complète
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  // EN LOCAL : Démarre le serveur sur le port 3001
  // SUR VERCEL : Cette ligne est ignorée (mode serverless)
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(3001);
    console.log('🚀 Services démarrés :\n');
    console.log(`📡 API NestJS      : http://localhost:3001`);
    console.log(`🗄️  MinIO Console   : http://localhost:9001 (minioadmin/minioadmin)`);
    console.log(`🌐 Next.js         : http://localhost:3000\n`);
  }
  
  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Pour Vercel (serverless)
const handler = async (req: any, res: any) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  cachedServer(req, res);
};

// Pour le développement local (démarrage direct)
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}

export default handler;