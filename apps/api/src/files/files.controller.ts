import 'reflect-metadata';
import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: undefined,
        limits: { fileSize: 50 * 1024 * 1024 },
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) throw new BadRequestException('Aucun fichier fourni');
        const fileName = await this.filesService.uploadFile(file, req.user.sub);
        const url = await this.filesService.getFileUrl(fileName);
        return { fileName, url };
    }

    @Get('url/*path')
    async getFileUrl(@Param('path') fileName: string) {
        const url = await this.filesService.getFileUrl(fileName);
        return { url };
    }
}