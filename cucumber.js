module.exports = {
  default: {
    paths: ['Features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['Utilities/Support/**/*.ts', 'StepsDefinitions/**/*.ts'],
    format: ['progress', 'json:reports/cucumber.json'],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
