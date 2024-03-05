import { Controller } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { UserEntity } from '../schemas/user.schema';
import { Contact, contactContract } from '../../shared/contact.contract';

@Controller()
export class ContactController {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  @TsRestHandler(contactContract.getContacts)
  async getContacts() {
    return tsRestHandler(contactContract.getContacts, async ({ body }) => {
      const user = await this.userModel.findOne({
        _id: body.userId,
      });

      const contacts: Contact[] = [];
      for (const contact of user?.contacts ?? []) {
        const contactUser = await this.userModel
          .findOne({ _id: contact._id })
          .lean();
        if (contactUser) {
          contacts.push({ ...contact, ...contactUser });
        }
      }

      return {
        status: 200,
        body: contacts,
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
        _id: body.newContactId,
        name: contact.username,
        avatarFileName: contact.avatarFileName,
      } as Contact;

      const contactAlreadyExists = user.contacts.find(
        (uc) => uc._id === newContact._id,
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

      const contact = user.contacts.find((uc) => uc._id === body.contactId);
      const contactGroup = user.contactGroups.find(
        (cg) => cg._id === body.contactId,
      );

      if (!contact && !contactGroup) {
        return { status: 404, body: false };
      }

      if (contact) {
        user.contacts = user.contacts.filter((u) => u._id !== body.contactId);
        user.markModified('contacts');
      }

      if (contactGroup) {
        user.contactGroups = user.contactGroups.filter(
          (cg) => cg._id !== body.contactId,
        );
        user.markModified('contactGroups');
      }

      await user.save();

      return {
        status: 204,
        body: true,
      };
    });
  }
}
