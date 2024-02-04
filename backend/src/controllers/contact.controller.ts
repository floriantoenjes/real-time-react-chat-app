import { Controller } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { User } from '../schemas/user.schema';
import { contract } from '../../shared/contract';

@Controller()
export class ContactController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @TsRestHandler(contract.getContacts)
  async getContacts() {
    return tsRestHandler(contract.getContacts, async ({ body }) => {
      const user = await this.userModel.findOne({
        _id: body.userId,
      });

      return {
        status: 200,
        body: user.contacts,
      };
    });
  }
}
