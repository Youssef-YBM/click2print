import 'reflect-metadata';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: config.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(config.get('MINIO_PORT') || '9000'),
      useSSL: false,
      accessKey: config.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: config.get('MINIO_SECRET_KEY') || 'minioadmin',
    });
    this.bucket = config.get('MINIO_BUCKET') || 'click2print';
    this.initBucket();
  }

  private async initBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, 'us-east-1');
        console.log(`✅ Bucket "${this.bucket}" créé`);
      }
    } catch (err) {
      console.error('MinIO init error:', err);
    }
  }

  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) throw new BadRequestException('Fichier manquant');

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', '3mf'].includes(ext || '')) {
      throw new BadRequestException('Format non supporté. Utilisez .stl, .obj ou .3mf');
    }

    const fileName = `${userId}/${Date.now()}-${file.originalname}`;

    await this.minioClient.putObject(
      this.bucket,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    return fileName;
  }

  async getFileUrl(fileName: string): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, fileName, 24 * 60 * 60);
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, fileName);
  }
}