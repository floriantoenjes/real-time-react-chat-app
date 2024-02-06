import { Controller } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { User } from '../schemas/user.schema';
import { Contact, contactContract } from '../../shared/contact.contract';

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
        body: user?.contacts ?? [],
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

      const newContact = {
        userId: body.newContactId,
        username: contact.username,
      } as Contact;

      const contactAlreadyExists = user.contacts.find(
        (uc) => uc.userId === newContact.userId,
      );
      if (contactAlreadyExists) {
        return { status: 400, body: false };
      }

      user.contacts.push(newContact);
      user.markModified('contacts');

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

      if (
        user.contacts.find((uc) => uc.userId === body.contactId) === undefined
      ) {
        return { status: 404, body: false };
      }

      user.contacts = user.contacts.filter((u) => u.userId !== body.contactId);
      user.markModified('contacts');

      await user.save();

      return {
        status: 204,
        body: true,
      };
    });
  }
}
