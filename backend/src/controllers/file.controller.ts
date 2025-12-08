import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { fileContract } from '../../shared/file.contract';
import { ObjectStorageService } from '../services/object-storage.service';

@Controller()
export class FileController {
    constructor(private readonly objectStorageService: ObjectStorageService) {}

    @TsRestHandler(fileContract.loadFile)
    async loadFile() {
        return tsRestHandler(fileContract.loadFile, async ({ body }) => {
            const obj = await this.objectStorageService.loadFile(body.fileName);
            if (!obj) {
                return { status: 404, body: false };
            }
            return { status: 200, body: obj };
        });
    }
}
