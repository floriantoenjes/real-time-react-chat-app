import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
  private s3: S3;
  constructor(readonly configService: ConfigService) {
    this.s3 = new S3({
      endpoint: 'https://fra1.digitaloceanspaces.com',
      credentials: {
        accessKeyId: configService.get('S3_ACCESS_KEY_ID') ?? '',
        secretAccessKey: configService.get('S3_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }
  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    const params = {
      Bucket: 'florians-realtime-chat-bucket',
      Key: filename,
      Body: buffer,
    };
    const { Location } = await this.s3.upload(params).promise();
    return Location;
  }

  async loadFile(fileName: string) {
    const params = {
      Bucket: 'florians-realtime-chat-bucket',
      Key: fileName,
    };
    const res = await this.s3.getObject(params).promise();

    return res.Body as Uint8Array;
  }
}
