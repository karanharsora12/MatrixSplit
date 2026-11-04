import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class UploadsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async recordAttachment(
    uploaderId: string,
    originalName: string,
    fileUrl: string,
    mimeType: string,
    sizeBytes: number,
    expenseId?: string
  ) {
    const [attachment] = await this.db
      .insert(schema.attachments)
      .values({
        uploaderId,
        originalName,
        fileUrl,
        mimeType,
        sizeBytes,
        expenseId: expenseId || null,
      })
      .returning();

    return attachment;
  }
}
