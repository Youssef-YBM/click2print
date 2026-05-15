import 'reflect-metadata';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { File } from './file.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private config: ConfigService,
  ) {
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
        console.log(`Bucket "${this.bucket}" cree`);
      }
    } catch (err) {
      console.error('MinIO init error:', err);
    }
  }

  async uploadFile(file: Express.Multer.File, userOrUserId: any, orderId?: string): Promise<File> {
    try {
      if (!file) throw new BadRequestException('Fichier manquant');

      let userId: string;
      
      if (typeof userOrUserId === 'string') {
        userId = userOrUserId;
      } else if (userOrUserId && typeof userOrUserId === 'object') {
        userId = userOrUserId.id || userOrUserId.sub || userOrUserId.userId;
      }
      
      if (!userId) {
        throw new BadRequestException('Utilisateur non identifie');
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('Utilisateur non trouve');
      }

      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!['stl', 'obj', '3mf'].includes(ext || '')) {
        throw new BadRequestException('Format non supporte. Utilisez .stl, .obj ou .3mf');
      }

      const fileName = `${user.id}/${Date.now()}-${file.originalname}`;

      await this.minioClient.putObject(
        this.bucket,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      const minioUrl = await this.minioClient.presignedGetObject(
        this.bucket, 
        fileName, 
        24 * 60 * 60
      );

      const fileRecord = this.fileRepository.create({
        fileName: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        orderId: orderId || null,
        uploadedBy: user,
        minioUrl: minioUrl,
        status: 'uploaded',
      });

      return await this.fileRepository.save(fileRecord);
    } catch (error) {
      throw new BadRequestException(`Erreur upload fichier: ${error.message}`);
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, fileName, 24 * 60 * 60);
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, fileName);
    await this.fileRepository.delete({ fileName });
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { uploadedBy: { id: userId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async getFilesByOrder(orderId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { orderId: orderId },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async getFileById(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
    });
    
    if (!file) throw new NotFoundException('Fichier non trouve');
    return file;
  }

  async updateFileStatus(id: string, status: string): Promise<File> {
    await this.fileRepository.update(id, { status });
    return this.getFileById(id);
  }
}