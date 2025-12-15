import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import User from "../../db/schemas/user.model";

describe("Auth Endpoints (Integration)", () => {
  // Connect to real DB before all tests
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment");
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 30000); // 30 second timeout for DB connection

  // Clean up test users before each test
  beforeEach(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
  }, 10000);

  // Clean up and disconnect after all tests
  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await mongoose.disconnect();
  }, 10000);

  describe("POST /api/auth/register", () => {
    const validUser = {
      name: "Test User",
      email: "testuser@test.com",
      password: "password123",
    };

    describe("success cases", () => {
      it("should register a new user and return 201", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send(validUser)
          .expect("Content-Type", /json/)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("User registered successfully");
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(validUser.email);
        expect(response.body.data.user.name).toBe(validUser.name);
        expect(response.body.data.user.role).toBe("user");
        expect(response.body.data.user.id).toBeDefined();
        // Password should NOT be returned
        expect(response.body.data.user.password).toBeUndefined();
      });

      it("should store the user in the database", async () => {
        await request(app)
          .post("/api/auth/register")
          .send(validUser)
          .expect(201);

        const user = await User.findOne({ email: validUser.email });
        expect(user).toBeDefined();
        expect(user?.name).toBe(validUser.name);
      });

      it("should hash the password before storing", async () => {
        await request(app)
          .post("/api/auth/register")
          .send(validUser)
          .expect(201);

        const user = await User.findOne({ email: validUser.email }).select("+password");
        expect(user?.password).toBeDefined();
        expect(user?.password).not.toBe(validUser.password);
      });
    });

    describe("validation errors", () => {
      it("should return 400 for missing name", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({ email: "test@test.com", password: "password123" })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("MISSING_NAME");
      });

      it("should return 400 for invalid email format", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({ name: "Test", email: "invalid-email", password: "password123" })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_EMAIL");
      });

      it("should return 400 for weak password", async () => {
        const response = await request(app)
          .post("/api/auth/register")
          .send({ name: "Test", email: "test@test.com", password: "123" })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("WEAK_PASSWORD");
      });
    });

    describe("conflict errors", () => {
      it("should return 409 for duplicate email", async () => {
        // First registration
        await request(app)
          .post("/api/auth/register")
          .send(validUser)
          .expect(201);

        // Second registration with same email
        const response = await request(app)
          .post("/api/auth/register")
          .send(validUser)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("DUPLICATE_EMAIL");
      });
    });
  });

  describe("POST /api/auth/login", () => {
    const testUser = {
      name: "Login Test User",
      email: "logintest@test.com",
      password: "password123",
    };

    // Create a user before login tests
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send(testUser);
    });

    describe("success cases", () => {
      it("should login with valid credentials and return 200", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: testUser.email, password: testUser.password })
          .expect("Content-Type", /json/)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.isAdmin).toBe(false);
      });

      it("should return a valid JWT token", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: testUser.email, password: testUser.password })
          .expect(200);

        const token = response.body.data.token;
        expect(token).toBeDefined();
        expect(typeof token).toBe("string");
        expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
      });

      it("should handle case-insensitive email", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: testUser.email.toUpperCase(), password: testUser.password })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe("validation errors", () => {
      it("should return 400 for missing email", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ password: "password123" })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it("should return 400 for missing password", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: "test@test.com" })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it("should return 400 for invalid email format", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: "invalid", password: "password123" })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe("authentication errors", () => {
      it("should return 401 for non-existent user", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: "nonexistent@test.com", password: "password123" })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_CREDENTIALS");
      });

      it("should return 401 for wrong password", async () => {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: testUser.email, password: "wrongpassword" })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_CREDENTIALS");
      });
    });
  });

  describe("Health Check", () => {
    it("should return 200 OK for health endpoint", async () => {
      const response = await request(app)
        .get("/health")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("ok");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("404 Not Found", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app)
        .get("/api/unknown-route")
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
