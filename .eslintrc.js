module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
    ecmaVersion: 2022,
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: [".eslintrc.js", "dist", "node_modules", "coverage"],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
    ],

    // General rules
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-underscore-dangle": "off",
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "max-len": [
      "error",
      { code: 100, ignoreComments: true, ignoreStrings: true },
    ],
    "no-await-in-loop": "off",
    "no-restricted-syntax": "off",
    "no-continue": "off",
    "consistent-return": "off",

    // Allow async without await (for express-async-errors)
    "@typescript-eslint/require-await": "off",

    // Relaxed rules for cleaner code
    "import/extensions": "off",
    "import/no-unresolved": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
  },
};
