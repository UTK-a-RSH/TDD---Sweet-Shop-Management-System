import User, { IUser, IUserDocument } from "../db/schemas/user.model";

type CreateUserInput = Pick<IUser, "name" | "email" | "password">;
type UserRecord = Pick<IUserDocument, "name" | "email" | "role"> & { id: string };

export const UserRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await User.findOne({ email });
    if (!user) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  async create(data: CreateUserInput): Promise<UserRecord> {
    const user = await User.create(data);
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },
};
