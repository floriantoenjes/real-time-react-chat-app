import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class ObjectStorageService {
  private s3: S3;
  constructor() {
    this.s3 = new S3({
      endpoint: 'https://fra1.digitaloceanspaces.com',
      credentials: {
        accessKeyId: 'DO00GPD6K8MQ3DKYATYJ',
        secretAccessKey: 'o4Ic9l39HfZoKdvkI6OrK85MAZ8820lrKz09/5xqNO8',
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
