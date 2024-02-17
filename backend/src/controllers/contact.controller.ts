import { Controller } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { User } from '../schemas/user.schema';
import { contactContract } from '../../shared/contact.contract';

@Controller()
export class ContactController {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @TsRestHandler(contactContract.getContacts)
  async getContacts() {
    return tsRestHandler(contactContract.getContacts, async ({ body }) => {
      const user = await this.userModel.findOne({
        _id: body.userId,
      });

      return {
        status: 200,
        body: await this.userModel.find({ _id: { $in: user?.contactIds } }),
      };
    });
  }

  @TsRestHandler(contactContract.addContact)
  async addContact() {
    return tsRestHandler(contactContract.addContact, async ({ body }) => {
      const user = await this.userModel.findOne({ _id: body.userId });
      const contact = await this.userModel.findOne({ _id: body.newContactId });

      if (!user || !contact) {
        return { status: 404, body: false };
      }

      const contactAlreadyAdded = user.contactIds.find(
        (cid) => cid === body.newContactId,
      );
      if (contactAlreadyAdded) {
        return { status: 400, body: false };
      }

      const newContact = await this.userModel
        .findOne({
          _id: body.newContactId,
        })
        .lean();
      if (!newContact) {
        return { status: 404, body: false };
      }

      user.contactIds.push(body.newContactId);
      user.markModified('contactIds');

      await user.save();

      return {
        status: 201,
        body: newContact,
      };
    });
  }

  @TsRestHandler(contactContract.removeContact)
  async removeContact() {
    return tsRestHandler(contactContract.removeContact, async ({ body }) => {
      const user = await this.userModel.findOne({ _id: body.userId });

      if (!user) {
        return { status: 404, body: false };
      }

      if (user.contactIds.find((cid) => cid === body.contactId) === undefined) {
        return { status: 404, body: false };
      }

      user.contactIds = user.contactIds.filter((cid) => cid !== body.contactId);
      user.markModified('contactIds');

      await user.save();

      return {
        status: 204,
        body: true,
      };
    });
  }
}
