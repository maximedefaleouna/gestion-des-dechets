module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/common/bootstrap/**",
    "!src/common/config/**",
    "!src/modules/**/*.swagger.js",
    "!src/modules/**/*.validator.js",
  ],
  moduleNameMapper: {
    "^supertest$": "<rootDir>/test/helpers/supertest.js",
  },
};
