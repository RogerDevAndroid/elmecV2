const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Configure path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
};

// Ensure proper module resolution
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;