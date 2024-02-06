import { Controller } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { User } from '../schemas/user.schema';
import { userContract } from '../../shared/user.contract';

@Controller()
export class UserController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @TsRestHandler(userContract.signIn)
  async signIn() {
    return tsRestHandler(userContract.signIn, async ({ body }) => {
      const user = await this.userModel.findOne({
        email: body.email,
        password: body.password,
      });

      if (!user) {
        return {
          status: 403,
          body: false,
        };
      }

      return {
        status: 200,
        body: user,
      };
    });
  }

  @TsRestHandler(userContract.searchUserByUsername)
  async searchUserByUsername() {
    return tsRestHandler(
      userContract.searchUserByUsername,
      async ({ body }) => {
        const user = await this.userModel.findOne({ username: body.username });

        if (!user) {
          return {
            status: 403,
            body: false,
          };
        }

        return {
          status: 200,
          body: user,
        };
      },
    );
  }
}
