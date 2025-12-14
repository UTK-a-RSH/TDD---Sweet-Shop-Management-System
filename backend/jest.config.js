/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  testMatch: ["**/?(*.)+(spec|test).ts"],

  moduleFileExtensions: ["ts", "js", "json"],

  clearMocks: true,

  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
    "!src/**/index.ts"
  ],

  coverageDirectory: "coverage",

  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"]
}
