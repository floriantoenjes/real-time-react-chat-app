import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
    // TODO: decouple with interface
    private s3: S3;

    constructor(readonly configService: ConfigService) {
        const s3Config: any = {};

        for (const configKey of [
            'S3_URL',
            'S3_REGION',
            'S3_DEBUG',
            'S3_ACCESS_KEY_ID',
            'S3_SECRET_ACCESS_KEY',
        ]) {
            const configValue = this.configService.get(configKey);
            if (!configValue) {
                throw new Error(`Config value "${configKey}" is not set!`);
            }
            s3Config[configKey] = configValue;
        }

        this.s3 = new S3({
            endpoint: s3Config.S3_URL,
            forcePathStyle: !!s3Config.S3_DEBUG,
            region: s3Config.S3_REGION,
            credentials: {
                accessKeyId: s3Config.S3_ACCESS_KEY,
                secretAccessKey: s3Config.S3_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile(
        buffer: Buffer,
        filename: string,
    ): Promise<string | undefined> {
        const params = {
            Bucket: this.configService.get('S3_BUCKET_NAME'),
            Key: filename,
            Body: buffer,
        };
        const res = await this.s3.putObject(params);

        return res?.VersionId;
    }

    async loadFile(fileName: string) {
        const params = {
            Bucket: this.configService.get('S3_BUCKET_NAME'),
            Key: fileName,
        };
        const res = await this.s3.getObject(params);

        return res.Body?.transformToByteArray();
    }
}
