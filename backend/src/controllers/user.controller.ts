import {
  Body,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  NestRequestShapes,
  TsRest,
  TsRestHandler,
  tsRestHandler,
  TsRestRequest,
} from '@ts-rest/nest';
import { userContract } from '../../shared/user.contract';
import { UserService } from '../services/user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from '../services/object-storage.service';
import { Public } from '../services/constants';
import Jimp from 'jimp';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  @TsRestHandler(userContract.getAll)
  async getAll() {
    return tsRestHandler(userContract.getAll, async () => {
      return this.userService.findUsersBy();
    });
  }

  @TsRestHandler(userContract.signIn)
  @Public()
  async signIn() {
    return tsRestHandler(userContract.signIn, async ({ body }) => {
      return this.userService.signIn(body.email, body.password);
    });
  }

  @TsRestHandler(userContract.refresh)
  @Public()
  async refresh() {
    return tsRestHandler(userContract.refresh, async ({ body }) => {
      return this.userService.refresh(body.accessToken);
    });
  }

  @TsRestHandler(userContract.signUp)
  @Public()
  async signUp() {
    return tsRestHandler(userContract.signUp, async ({ body }) => {
      return this.userService.createUser(
        body.email,
        body.password,
        body.username,
      );
    });
  }

  @TsRestHandler(userContract.searchUserByUsername)
  async searchUserByUsername() {
    return tsRestHandler(
      userContract.searchUserByUsername,
      async ({ body }) => {
        return this.userService.findUserBy({ username: body.username });
      },
    );
  }

  @TsRestHandler(userContract.loadAvatar)
  async loadAvatar() {
    return tsRestHandler(userContract.loadAvatar, async ({ params }) => {
      const objectDataString = await this.objectStorageService.loadFile(
        params.userId + '_avatar',
      );

      if (objectDataString) {
        return {
          status: 200,
          body: objectDataString,
        };
      }

      return {
        status: 404,
        body: false,
      };
    });
  }

  @TsRest(userContract.uploadAvatar)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUserAvatar(
    @TsRestRequest()
    {}: NestRequestShapes<typeof userContract>['uploadAvatar'],
    @UploadedFile() avatar: Express.Multer.File,
    @Body()
    body: {
      userId: string;
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) {
    body.userId = body.userId.replaceAll('"', '');
    const fileName = body.userId + '_avatar';

    async function crop(image: Jimp) {
      // Read the image.
      image.crop(+body.x, +body.y, +body.width, +body.height);
      image.resize(512, 512);
      // Save and overwrite the image
    }
    const img = await Jimp.read(avatar.buffer);
    await crop(img);

    img.quality(60);
    const jpeg = await img.getBufferAsync(Jimp.MIME_JPEG);

    await this.objectStorageService.uploadFile(jpeg, fileName);

    await this.userService.updateUser({
      _id: body.userId,
      avatarFileName: fileName,
    });

    return {
      status: 200 as const,
      body: true,
    };
  }
}
