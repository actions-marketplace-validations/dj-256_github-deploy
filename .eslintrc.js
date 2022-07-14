module.exports = {
  env: {
    node: true,
  },
  extends: [
    "eslint:recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
  },
  plugins: [
    "@typescript-eslint"
  ],
  rules: {
    semi: "never"
  }
}
