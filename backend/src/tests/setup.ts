import dotenv from "dotenv";

// Load environment variables for all tests
dotenv.config();

// Set test environment
process.env.NODE_ENV = "test";

// Increase timeout for integration tests (DB operations can be slow)
jest.setTimeout(30000);
