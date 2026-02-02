import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { fileContract } from '../../shared/file.contract';
import { ObjectStorageService } from '../services/object-storage.service';
import { UserId } from '../decorators/user-id.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { FileAccessEntity } from '../schemas/file-access.schema';
import { Model } from 'mongoose';
import { UnauthorizedException } from '../errors/external/unauthorized.exception';

@Controller()
export class FileController {
    constructor(
        @InjectModel(FileAccessEntity.name)
        private readonly fileModel: Model<FileAccessEntity>,
        private readonly objectStorageService: ObjectStorageService,
    ) {}

    @TsRestHandler(fileContract.loadFile)
    async loadFile(@UserId() userId: string) {
        return tsRestHandler(fileContract.loadFile, async ({ body }) => {
            const fileAccessModel = await this.fileModel
                .findOne({
                    accessibleBy: userId,
                    storageId: body.fileName,
                })
                .lean();
            if (!fileAccessModel) {
                throw new UnauthorizedException();
            }

            const obj = await this.objectStorageService.loadFile(body.fileName);
            if (!obj) {
                return { status: 404 as const, body: false };
            }
            return { status: 200 as const, body: obj };
        });
    }
}
