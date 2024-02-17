import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '../../shared/user.contract';
import { UserService } from '../services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @TsRestHandler(userContract.signIn)
  async signIn() {
    return tsRestHandler(userContract.signIn, async ({ body }) => {
      return this.userService.findUserBy({
        email: body.email,
        password: body.password,
      });
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
}
