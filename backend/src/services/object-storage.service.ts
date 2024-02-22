import { Injectable } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
  private s3: S3;
  constructor(readonly configService: ConfigService) {
    this.s3 = new S3({
      endpoint: 'https://fra1.digitaloceanspaces.com',
      region: 'fra1',
      credentials: {
        accessKeyId:
          configService.get('S3_ACCESS_KEY_ID') ??
          process.env.s3AccessKey ??
          '',
        secretAccessKey:
          configService.get('S3_SECRET_ACCESS_KEY') ??
          process.env.s3SecretAccessKey ??
          '',
      },
    });
  }
  async uploadFile(
    buffer: Buffer,
    filename: string,
  ): Promise<string | undefined> {
    const params = {
      Bucket: 'florians-realtime-chat-bucket',
      Key: filename,
      Body: buffer,
    };
    const res = await this.s3.putObject(params);

    return res?.VersionId;
  }

  async loadFile(fileName: string) {
    const params = {
      Bucket: 'florians-realtime-chat-bucket',
      Key: fileName,
    };
    const res = await this.s3.getObject(params);

    return res.Body?.transformToByteArray();
  }
}
