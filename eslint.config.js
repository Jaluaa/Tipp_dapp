module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn", // Change from error to warning
    "react/no-unescaped-entities": "warn" // Change from error to warning
  }
};