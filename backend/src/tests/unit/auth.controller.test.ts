import { AuthController } from "../../controllers/AuthController";
import { AuthService } from "../../services/AuthService";
import { ValidationError, ConflictError, UnauthorizedError } from "../../utils/errors";
import { Request, Response } from "express";

// Mock AuthService
jest.mock("../../services/AuthService");

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe("register", () => {
    describe("success cases", () => {
      it("should register a user and return 201 status", async () => {
        const userData = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        const serviceResult = {
          user: {
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
            role: "user" as const,
          },
        };

        mockRequest = { body: userData };
        (AuthService.register as jest.Mock).mockResolvedValue(serviceResult);

        await AuthController.register(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(AuthService.register).toHaveBeenCalledWith(userData);
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: "User registered successfully",
          data: serviceResult,
        });
      });

      it("should pass request body directly to AuthService.register", async () => {
        const userData = {
          name: "Jane Smith",
          email: "jane@example.com",
          password: "secure456",
        };

        mockRequest = { body: userData };
        (AuthService.register as jest.Mock).mockResolvedValue({
          user: { id: "1", name: "Jane Smith", email: "jane@example.com", role: "user" },
        });

        await AuthController.register(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(AuthService.register).toHaveBeenCalledWith(userData);
      });
    });

    describe("validation errors", () => {
      it("should throw ValidationError for missing name", async () => {
        mockRequest = {
          body: { email: "john@example.com", password: "password123" },
        };

        (AuthService.register as jest.Mock).mockRejectedValue(
          new ValidationError("Name is required", "MISSING_NAME")
        );

        await expect(
          AuthController.register(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });

      it("should throw ValidationError for invalid email", async () => {
        mockRequest = {
          body: { name: "John", email: "invalid", password: "password123" },
        };

        (AuthService.register as jest.Mock).mockRejectedValue(
          new ValidationError("Invalid email format", "INVALID_EMAIL")
        );

        await expect(
          AuthController.register(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });

      it("should throw ValidationError for weak password", async () => {
        mockRequest = {
          body: { name: "John", email: "john@example.com", password: "123" },
        };

        (AuthService.register as jest.Mock).mockRejectedValue(
          new ValidationError("Password must be at least 6 characters", "WEAK_PASSWORD")
        );

        await expect(
          AuthController.register(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe("conflict errors", () => {
      it("should throw ConflictError for duplicate email", async () => {
        mockRequest = {
          body: {
            name: "John Doe",
            email: "existing@example.com",
            password: "password123",
          },
        };

        (AuthService.register as jest.Mock).mockRejectedValue(
          new ConflictError("Email already exists", "DUPLICATE_EMAIL")
        );

        await expect(
          AuthController.register(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ConflictError);
      });
    });
  });

  describe("login", () => {
    describe("success cases", () => {
      it("should login a user and return 200 status with token", async () => {
        const credentials = {
          email: "john@example.com",
          password: "password123",
        };

        const serviceResult = {
          user: {
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
            role: "user" as const,
          },
          token: "jwt-token-here",
          isAdmin: false,
        };

        mockRequest = { body: credentials };
        (AuthService.login as jest.Mock).mockResolvedValue(serviceResult);

        await AuthController.login(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(AuthService.login).toHaveBeenCalledWith(credentials);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: "Login successful",
          data: serviceResult,
        });
      });

      it("should login an admin user and return isAdmin true", async () => {
        const credentials = {
          email: "admin@example.com",
          password: "adminpass",
        };

        const serviceResult = {
          user: {
            id: "admin-123",
            name: "Admin User",
            email: "admin@example.com",
            role: "admin" as const,
          },
          token: "admin-jwt-token",
          isAdmin: true,
        };

        mockRequest = { body: credentials };
        (AuthService.login as jest.Mock).mockResolvedValue(serviceResult);

        await AuthController.login(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: "Login successful",
          data: serviceResult,
        });
      });

      it("should pass credentials directly to AuthService.login", async () => {
        const credentials = {
          email: "test@example.com",
          password: "testpass",
        };

        mockRequest = { body: credentials };
        (AuthService.login as jest.Mock).mockResolvedValue({
          user: { id: "1", name: "Test", email: "test@example.com", role: "user" },
          token: "token",
          isAdmin: false,
        });

        await AuthController.login(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(AuthService.login).toHaveBeenCalledWith(credentials);
      });
    });

    describe("validation errors", () => {
      it("should throw ValidationError for missing email", async () => {
        mockRequest = { body: { password: "password123" } };

        (AuthService.login as jest.Mock).mockRejectedValue(
          new ValidationError("Email is required", "MISSING_EMAIL")
        );

        await expect(
          AuthController.login(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });

      it("should throw ValidationError for missing password", async () => {
        mockRequest = { body: { email: "john@example.com" } };

        (AuthService.login as jest.Mock).mockRejectedValue(
          new ValidationError("Password is required", "MISSING_PASSWORD")
        );

        await expect(
          AuthController.login(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });

      it("should throw ValidationError for invalid email format", async () => {
        mockRequest = { body: { email: "invalid", password: "password123" } };

        (AuthService.login as jest.Mock).mockRejectedValue(
          new ValidationError("Invalid email format", "INVALID_EMAIL")
        );

        await expect(
          AuthController.login(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe("authentication errors", () => {
      it("should throw UnauthorizedError for non-existent user", async () => {
        mockRequest = {
          body: { email: "nonexistent@example.com", password: "password123" },
        };

        (AuthService.login as jest.Mock).mockRejectedValue(
          new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS")
        );

        await expect(
          AuthController.login(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(UnauthorizedError);
      });

      it("should throw UnauthorizedError for wrong password", async () => {
        mockRequest = {
          body: { email: "john@example.com", password: "wrongpassword" },
        };

        (AuthService.login as jest.Mock).mockRejectedValue(
          new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS")
        );

        await expect(
          AuthController.login(mockRequest as Request, mockResponse as Response)
        ).rejects.toThrow(UnauthorizedError);
      });
    });
  });
});
