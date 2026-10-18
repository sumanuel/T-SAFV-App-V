const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "android/*", "ios/*"],
  },
  {
    rules: {
      // sdk.js exporta cada funcion por nombre y tambien en un objeto default.
      "import/no-named-as-default-member": "off",
      // Patrones heredados que funcionan hoy; se corrigen al partir las
      // pantallas grandes (MEJORAS.md 2.3), por eso avisan sin bloquear.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  {
    files: ["__tests__/**/*.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        __dirname: "readonly",
      },
    },
  },
]);
