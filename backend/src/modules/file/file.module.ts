import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FileAccessEntity, FileAccessSchema } from './file-access.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: FileAccessEntity.name, schema: FileAccessSchema },
        ]),
    ],
    controllers: [FileController],
    exports: [MongooseModule],
})
export class FileModule {}
