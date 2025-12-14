import bcrypt from "bcrypt";
import { CreateUserDto } from "../types/user.types";
import { UserRepository } from "../repositories/UserRepository";

export type RegisterInput = CreateUserDto;

export type RegisterResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  };
};

/**
 * AuthService handles user authentication business logic.
 */
export class AuthService {
  static async register(input: RegisterInput): Promise<RegisterResult> {
    const { name, email, password } = input;

    // Validate email format
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate password strength
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check for duplicate email
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error("Email already exists");
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with hashed password
    const created = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    return {
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
      },
    };
  }
}
