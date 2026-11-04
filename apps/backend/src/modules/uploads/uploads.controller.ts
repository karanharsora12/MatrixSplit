import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { CurrentUser, CurrentUserPayload } from '../../common/current-user.decorator';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadsDir = resolve(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    })
  )
  async uploadReceipt(
    @UploadedFile() file: any,
    @CurrentUser() user: CurrentUserPayload
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const fileUrl = `/uploads/${file.filename}`;
    const attachment = await this.uploadsService.recordAttachment(
      user.userId,
      file.originalname,
      fileUrl,
      file.mimetype,
      file.size
    );

    return {
      fileUrl,
      attachmentId: attachment.id,
      originalName: file.originalname,
    };
  }
}
