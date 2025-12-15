import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import User from "../../db/schemas/user.model";
import Sweet from "../../db/schemas/sweet.model";

describe("Sweets Endpoints (Integration)", () => {
  let authToken: string;
  let adminToken: string;

  // Connect to real DB before all tests
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set in environment");
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({ email: /@test\.com$/ });
    await Sweet.deleteMany({ name: /^Test/ });

    // Create a regular user
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "sweetuser@test.com",
        password: "password123",
      });

    // Login as regular user to get token
    const userLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "sweetuser@test.com",
        password: "password123",
      });
    authToken = userLoginRes.body.data.token;

    // Create admin user directly in DB
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("adminpass123", 10);
    await User.create({
      name: "Test Admin",
      email: "sweetadmin@test.com",
      password: hashedPassword,
      role: "admin",
    });

    // Login as admin to get token
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "sweetadmin@test.com",
        password: "adminpass123",
      });
    adminToken = adminRes.body.data.token;
  }, 30000);

  // Clean up sweets before each test
  beforeEach(async () => {
    await Sweet.deleteMany({ name: /^Test/ });
  });

  // Clean up after all tests
  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await Sweet.deleteMany({ name: /^Test/ });
    await mongoose.disconnect();
  });

  describe("POST /api/sweets", () => {
    const validSweet = {
      name: "Test Chocolate",
      category: "Chocolates",
      price: 5.99,
      quantity: 100,
    };

    describe("success cases", () => {
      it("should create a sweet and return 201", async () => {
        const response = await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send(validSweet)
          .expect("Content-Type", /json/)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Sweet added successfully");
        expect(response.body.data.sweet).toBeDefined();
        expect(response.body.data.sweet.name).toBe(validSweet.name);
        expect(response.body.data.sweet.category).toBe(validSweet.category);
        expect(response.body.data.sweet.price).toBe(validSweet.price);
        expect(response.body.data.sweet.quantity).toBe(validSweet.quantity);
      });

      it("should store the sweet in the database", async () => {
        await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send(validSweet)
          .expect(201);

        const sweet = await Sweet.findOne({ name: validSweet.name });
        expect(sweet).toBeDefined();
        expect(sweet?.category).toBe(validSweet.category);
      });
    });

    describe("validation errors", () => {
      it("should return 400 for missing name", async () => {
        const response = await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ category: "Chocolates", price: 5.99, quantity: 100 })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("MISSING_NAME");
      });

      it("should return 400 for negative price", async () => {
        const response = await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ ...validSweet, price: -5 })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("NEGATIVE_PRICE");
      });

      it("should return 400 for negative quantity", async () => {
        const response = await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ ...validSweet, quantity: -10 })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe("conflict errors", () => {
      it("should return 409 for duplicate name", async () => {
        // Create first sweet
        await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send(validSweet)
          .expect(201);

        // Try to create duplicate
        const response = await request(app)
          .post("/api/sweets")
          .set("Authorization", `Bearer ${authToken}`)
          .send(validSweet)
          .expect(409);

        expect(response.body.success).toBe(false);
      });
    });

    describe("authentication errors", () => {
      it("should return 401 without auth token", async () => {
        const response = await request(app)
          .post("/api/sweets")
          .send(validSweet)
          .expect(401);

        expect(response.body.message).toContain("token");
      });
    });
  });

  describe("GET /api/sweets", () => {
    beforeEach(async () => {
      // Create test sweets
      await Sweet.create([
        { name: "Test Sweet 1", category: "Candies", price: 2.5, quantity: 50 },
        { name: "Test Sweet 2", category: "Chocolates", price: 5.0, quantity: 30 },
      ]);
    });

    it("should return all sweets", async () => {
      const response = await request(app)
        .get("/api/sweets")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets).toBeDefined();
      expect(response.body.data.sweets.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it("should return 401 without auth token", async () => {
      await request(app)
        .get("/api/sweets")
        .expect(401);
    });
  });

  describe("GET /api/sweets/search", () => {
    beforeEach(async () => {
      await Sweet.create([
        { name: "Test Candy", category: "Candies", price: 2.5, quantity: 50 },
        { name: "Test Chocolate Bar", category: "Chocolates", price: 5.0, quantity: 30 },
        { name: "Test Premium Chocolate", category: "Chocolates", price: 15.0, quantity: 20 },
      ]);
    });

    it("should search by name", async () => {
      const response = await request(app)
        .get("/api/sweets/search?name=Candy")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.length).toBeGreaterThanOrEqual(1);
    });

    it("should search by category", async () => {
      const response = await request(app)
        .get("/api/sweets/search?category=Chocolates")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweets.length).toBeGreaterThanOrEqual(2);
    });

    it("should search by price range", async () => {
      const response = await request(app)
        .get("/api/sweets/search?minPrice=3&maxPrice=10")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("PUT /api/sweets/:id", () => {
    let sweetId: string;

    beforeEach(async () => {
      const sweet = await Sweet.create({
        name: "Test Update Sweet",
        category: "Candies",
        price: 3.0,
        quantity: 40,
      });
      sweetId = sweet._id.toString();
    });

    it("should update a sweet", async () => {
      const response = await request(app)
        .put(`/api/sweets/${sweetId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ price: 4.5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sweet.price).toBe(4.5);
    });

    it("should return 404 for non-existent sweet", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .put(`/api/sweets/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ price: 4.5 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/sweets/:id", () => {
    let sweetId: string;

    beforeEach(async () => {
      const sweet = await Sweet.create({
        name: "Test Delete Sweet",
        category: "Candies",
        price: 3.0,
        quantity: 40,
      });
      sweetId = sweet._id.toString();
    });

    it("should delete a sweet when admin", async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Sweet deleted successfully");

      // Verify deletion
      const deleted = await Sweet.findById(sweetId);
      expect(deleted).toBeNull();
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .delete(`/api/sweets/${sweetId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent sweet", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/sweets/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/sweets/:id/purchase", () => {
    let sweetId: string;

    beforeEach(async () => {
      const sweet = await Sweet.create({
        name: "Test Purchase Sweet",
        category: "Candies",
        price: 3.0,
        quantity: 50,
      });
      sweetId = sweet._id.toString();
    });

    it("should purchase a sweet and decrease quantity", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Purchase successful");
      expect(response.body.data.purchased).toBe(5);
      expect(response.body.data.remaining).toBe(45);

      // Verify in DB
      const updated = await Sweet.findById(sweetId);
      expect(updated?.quantity).toBe(45);
    });

    it("should return 400 for insufficient stock", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quantity: 100 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INSUFFICIENT_STOCK");
    });

    it("should return 400 for invalid quantity", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quantity: -5 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent sweet", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/purchase`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/sweets/:id/restock", () => {
    let sweetId: string;

    beforeEach(async () => {
      const sweet = await Sweet.create({
        name: "Test Restock Sweet",
        category: "Candies",
        price: 3.0,
        quantity: 20,
      });
      sweetId = sweet._id.toString();
    });

    it("should restock a sweet when admin", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ quantity: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Restock successful");
      expect(response.body.data.added).toBe(30);
      expect(response.body.data.previousQuantity).toBe(20);
      expect(response.body.data.newQuantity).toBe(50);

      // Verify in DB
      const updated = await Sweet.findById(sweetId);
      expect(updated?.quantity).toBe(50);
    });

    it("should return 403 for non-admin user", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ quantity: 30 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 for invalid quantity", async () => {
      const response = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent sweet", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/sweets/${fakeId}/restock`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ quantity: 30 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
