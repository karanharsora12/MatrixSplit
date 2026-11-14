const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Find the project and workspace root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (packages/shared, packages/watermelon-ui)
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Ensure symlinks/workspaces resolve correctly
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, {
  input: path.resolve(projectRoot, 'global.css'),
  configPath: path.resolve(projectRoot, 'tailwind.config.js'),
  inlineRem: 16,
});
