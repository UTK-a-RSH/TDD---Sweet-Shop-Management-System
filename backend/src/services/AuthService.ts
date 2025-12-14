import bcrypt from "bcrypt";
import { CreateUserDto } from "../types/user.types";
import { UserRepository } from "../repositories/UserRepository";
import { validateEmail, validatePassword } from "../utils/validators";
import { ConflictError } from "../utils/errors";

export type RegisterInput = CreateUserDto;

export type RegisterResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  };
};

const SALT_ROUNDS = 10;

/**
 * AuthService handles user authentication business logic.
 */
export class AuthService {
  /**
   * Registers a new user.
   * @param input - User registration data (name, email, password)
   * @returns Created user data (without password)
   * @throws ValidationError if input is invalid
   * @throws ConflictError if email already exists
   */
  static async register(input: RegisterInput): Promise<RegisterResult> {
    const { name, email, password } = input;

    // Validate input
    validateEmail(email);
    validatePassword(password);

    // Check for duplicate email
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("Email already exists", "DUPLICATE_EMAIL");
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

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
