import 'reflect-metadata';
import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Query('orderId') orderId?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    
    const fileRecord = await this.filesService.uploadFile(
      file, 
      req.user, 
      orderId
    );
    
    return {
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      size: fileRecord.size,
      orderId: fileRecord.orderId,
      uploadedAt: fileRecord.uploadedAt,
      url: fileRecord.minioUrl,
    };
  }

  @Get('user/files')
  async getUserFiles(@Request() req: any) {
    const files = await this.filesService.getFilesByUser(req.user.id);
    return files;
  }

  @Get('order/:orderId')
  async getOrderFiles(@Param('orderId') orderId: string) {
    const files = await this.filesService.getFilesByOrder(orderId);
    return files;
  }

  @Get(':id')
  async getFileById(@Param('id') id: string) {
    const file = await this.filesService.getFileById(id);
    const url = await this.filesService.getFileUrl(file.fileName);
    return { ...file, url };
  }

  @Get('url/*path')
  async getFileUrl(@Param('path') fileName: string) {
    const url = await this.filesService.getFileUrl(fileName);
    return { url };
  }
}