const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(jose)/)",
  ],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  // Override transformIgnorePatterns so that next/jest doesn't overwrite it
  config.transformIgnorePatterns = ["/node_modules/(?!(jose)/)"];
  return config;
};
