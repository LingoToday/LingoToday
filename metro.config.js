const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro can resolve all modules
config.resolver.assetExts.push('json', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp4', 'mov');
config.resolver.sourceExts.push('js', 'jsx', 'ts', 'tsx');

// Add alias for attached_assets to match the web client structure
config.resolver.alias = {
  '@assets': path.resolve(__dirname, '../attached_assets'),
};

module.exports = config;