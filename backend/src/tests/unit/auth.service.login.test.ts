import { AuthService } from "../../services/AuthService";
import { LoginDto, UserResponse } from "../../types/user.types";

// Types for repository mocks (login needs password for comparison)
type UserWithPassword = Pick<UserResponse, "name" | "email" | "role"> & {
  id: string;
  password: string;
};

const mockUserRepoFindByEmailWithPassword = jest.fn<
  Promise<UserWithPassword | null>,
  [string]
>();

jest.mock("../../repositories/UserRepository", () => ({
  UserRepository: {
    findByEmailWithPassword: (email: string) =>
      mockUserRepoFindByEmailWithPassword(email),
  },
}));

// Mock bcrypt for password comparison
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

// Mock jsonwebtoken for token generation
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-jwt-token"),
}));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

describe("AuthService.login", () => {
  const validHashedPassword = "$2b$10$hashedpassword";

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepoFindByEmailWithPassword.mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  });

  describe("successful login", () => {
    it("returns user and token with valid credentials", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: validHashedPassword,
        role: "user",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await AuthService.login({
        email: "john@example.com",
        password: "secret123",
      });

      expect(result).toMatchObject({
        user: {
          id: "user-123",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
        },
        token: expect.any(String),
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          email: "john@example.com",
          role: "user",
        }),
        undefined, // JWT_SECRET is undefined in test env
        { expiresIn: "7d" }
      );
    });

    it("returns admin role in token for admin users", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "admin-123",
        name: "Admin User",
        email: "admin@example.com",
        password: validHashedPassword,
        role: "admin",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await AuthService.login({
        email: "admin@example.com",
        password: "adminpass",
      });

      expect(result.user.role).toBe("admin");
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: "admin" }),
        undefined, // JWT_SECRET is undefined in test env
        { expiresIn: "7d" }
      );
    });
  });

  describe("validation errors", () => {
    it("rejects missing email", async () => {
      await expect(
        AuthService.login({
          email: "",
          password: "secret123",
        })
      ).rejects.toThrow(/email/i);
    });

    it("rejects invalid email format", async () => {
      await expect(
        AuthService.login({
          email: "invalid-email",
          password: "secret123",
        })
      ).rejects.toThrow(/email/i);
    });

    it("rejects missing password", async () => {
      await expect(
        AuthService.login({
          email: "john@example.com",
          password: "",
        })
      ).rejects.toThrow(/password/i);
    });
  });

  describe("authentication errors", () => {
    it("rejects non-existent user", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce(null);

      await expect(
        AuthService.login({
          email: "nonexistent@example.com",
          password: "secret123",
        })
      ).rejects.toThrow(/invalid email or password/i);
    });

    it("rejects wrong password", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: validHashedPassword,
        role: "user",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        AuthService.login({
          email: "john@example.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow(/invalid email or password/i);
    });
  });

  describe("edge cases", () => {
    it("trims email before lookup", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: validHashedPassword,
        role: "user",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await AuthService.login({
        email: "  john@example.com  ",
        password: "secret123",
      });

      expect(mockUserRepoFindByEmailWithPassword).toHaveBeenCalledWith(
        "john@example.com"
      );
    });

    it("converts email to lowercase before lookup", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: validHashedPassword,
        role: "user",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await AuthService.login({
        email: "JOHN@EXAMPLE.COM",
        password: "secret123",
      });

      expect(mockUserRepoFindByEmailWithPassword).toHaveBeenCalledWith(
        "john@example.com"
      );
    });
  });

  describe("role verification", () => {
    it("correctly identifies user as admin", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "admin-123",
        name: "Admin User",
        email: "admin@example.com",
        password: validHashedPassword,
        role: "admin",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await AuthService.login({
        email: "admin@example.com",
        password: "adminpass",
      });

      expect(result.user.role).toBe("admin");
      expect(result.isAdmin).toBe(true);
    });

    it("correctly identifies user as non-admin", async () => {
      mockUserRepoFindByEmailWithPassword.mockResolvedValueOnce({
        id: "user-123",
        name: "Regular User",
        email: "user@example.com",
        password: validHashedPassword,
        role: "user",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await AuthService.login({
        email: "user@example.com",
        password: "userpass",
      });

      expect(result.user.role).toBe("user");
      expect(result.isAdmin).toBe(false);
    });
  });
});
