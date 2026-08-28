export default [
  {
    files:['playwright.config.js','tests/e2e/**/*.js'],
    languageOptions:{ecmaVersion:2023,sourceType:'module',globals:{process:'readonly',globalThis:'readonly',document:'readonly',window:'readonly'}},
    rules:{
      'no-undef':'error',
      'no-unused-vars':['error',{argsIgnorePattern:'^_'}],
      'no-unreachable':'error',
      'no-dupe-keys':'error'
    }
  }
];
