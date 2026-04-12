module.exports = {
  env: {
    es2022: true,
    jest: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  ignorePatterns: ["coverage/", "logs/", "node_modules/"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script",
  },
  rules: {
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
};
