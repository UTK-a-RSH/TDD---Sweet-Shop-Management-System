import bcrypt from "bcrypt";
import { CreateUserDto, LoginDto } from "../types/user.types";
import { UserRepository } from "../repositories/UserRepository";
import { validateEmail, validatePassword, validateRegisterInput } from "../utils/validators";
import { ConflictError, UnauthorizedError, ValidationError } from "../utils/errors";
import { generateToken } from "../utils/jwt";

// Types
export type RegisterInput = CreateUserDto;
export type LoginInput = LoginDto;

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface RegisterResult {
  user: UserData;
}

export interface LoginResult {
  user: UserData;
  token: string;
  isAdmin: boolean;
}

// Constants
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

    // Validate all input fields
    validateRegisterInput({ name, email, password });

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

  /**
   * Authenticates a user and returns a JWT token.
   * @param input - Login credentials (email, password)
   * @returns User data, JWT token, and isAdmin flag
   * @throws ValidationError if input is invalid
   * @throws UnauthorizedError if credentials are incorrect
   */
  static async login(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    // Validate email format
    if (!email || !email.trim()) {
      throw new ValidationError("Email is required", "MISSING_EMAIL");
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    validateEmail(normalizedEmail);

    // Validate password presence
    if (!password) {
      throw new ValidationError("Password is required", "MISSING_PASSWORD");
    }

    // Find user with password
    const user = await UserRepository.findByEmailWithPassword(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Generate JWT token using centralized utility
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      isAdmin: user.role === "admin",
    };
  }
}
