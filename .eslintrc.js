{
  "root": true,
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "vue"
  ],
  "rules": {
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "off",
    "vue/require-default-prop": "off",
    "vue/require-prop-types": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": "error",
    "quotes": ["error", "single", { "avoidEscape": true }],
    "semi": ["error", "never"],
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "linebreak-style": ["error", "unix"],
    "comma-dangle": ["error", "never"]
  },
  "overrides": [
    {
      "files": ["*.vue"],
      "rules": {
        "indent": "off",
        "vue/html-indent": ["error", 2],
        "vue/singleline-html-element-content-newline": "off",
        "vue/max-attributes-per-line": ["error", {
          "singleline": { "max": 5 },
          "multiline": { "max": 1 }
        }]
      }
    }
  ]
}