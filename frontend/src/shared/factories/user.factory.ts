import { UserService } from "../services/UserService";

export class UserFactory {
    static async createUserWithAvatarBytes<
        T extends {
            _id: string;
            avatarFileName?: string | undefined;
            avatarBase64?: string | undefined;
        },
    >(user: T, userService: UserService) {
        if (!user.avatarFileName?.startsWith(user._id)) {
            return user;
        }
        const avatarBase64 = await userService.loadAvatar(user._id);
        if (avatarBase64) {
            user.avatarBase64 = avatarBase64;
        }
        return user;
    }
}
