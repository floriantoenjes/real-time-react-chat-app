import { Controller } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserEntity } from '../schemas/user.schema';
import {
  ContactGroup,
  contactGroupContract,
} from '../../shared/contact-group.contract';

@Controller()
export class ContactGroupController {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  @TsRestHandler(contactGroupContract.getContactGroups)
  async getContactGroups() {
    return tsRestHandler(
      contactGroupContract.getContactGroups,
      async ({ body }) => {
        const user = await this.userModel.findOne({
          _id: body.userId,
        });

        return {
          status: 200,
          body: user?.contactGroups ?? [],
        };
      },
    );
  }

  @TsRestHandler(contactGroupContract.addContactGroup)
  async addContactGroup() {
    return tsRestHandler(
      contactGroupContract.addContactGroup,
      async ({ body }) => {
        const user = await this.userModel.findOne({ _id: body.userId });
        const members = await this.userModel.find({
          _id: { $in: body.memberIds },
        });

        if (!user || !members.length) {
          return { status: 404, body: false };
        }

        const newContactGroup = {
          _id: new Types.ObjectId().toString(),
          memberIds: body.memberIds,
          name: body.name,
        } as ContactGroup;

        const contactAlreadyExists = user.contactGroups.find(
          (group) => group.name === newContactGroup.name,
        );
        if (contactAlreadyExists) {
          return { status: 400, body: false };
        }

        for (const member of [user, ...members]) {
          member.contactGroups.push({
            ...newContactGroup,
            memberIds: [user, ...members]
              .map((m) => m._id)
              .filter((mid) => mid !== member._id)
              .map((mid) => mid.toString()),
          });
          member.markModified('contactGroups');

          await member.save();
        }

        return {
          status: 201,
          body: newContactGroup,
        };
      },
    );
  }

  @TsRestHandler(contactGroupContract.removeContactGroup)
  async removeContactGroup() {
    return tsRestHandler(
      contactGroupContract.removeContactGroup,
      async ({ body }) => {
        const user = await this.userModel.findOne({ _id: body.userId });

        if (!user) {
          return { status: 404, body: false };
        }

        if (
          user.contactGroups.find((uc) => uc._id === body.contactGroupId) ===
          undefined
        ) {
          return { status: 404, body: false };
        }

        user.contactGroups = user.contactGroups.filter(
          (group) => group._id !== body.contactGroupId,
        );
        user.markModified('contactGroups');

        await user.save();

        return {
          status: 204,
          body: true,
        };
      },
    );
  }
}
