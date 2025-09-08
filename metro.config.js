const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Configure path aliases with explicit file extensions
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
  '@/contexts/SupabaseAuthContext': path.resolve(__dirname, 'contexts/SupabaseAuthContext.tsx'),
  '@/hooks/useFrameworkReady': path.resolve(__dirname, 'hooks/useFrameworkReady.ts'),
  '@/contexts/ChatContext': path.resolve(__dirname, 'contexts/ChatContext.tsx'),
};

// Ensure proper module resolution
config.resolver.platforms = ['web', 'native', 'ios', 'android'];
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'];

// Handle CommonJS modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add unstable_enablePackageExports for better ESM support
config.resolver.unstable_enablePackageExports = true;

module.exports = config;