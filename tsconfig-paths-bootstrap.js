const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const baseUrl = path.resolve(__dirname, 'src');

tsConfigPaths.register({
  baseUrl,
  paths: {
    '@core/*': ['core/*'],
    '@modules/*': ['modules/*'],
    '@shared/*': ['shared/*'],
  },
});
