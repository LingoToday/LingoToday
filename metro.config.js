const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// FIXED: Properly configure asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'mov', 'MOV', // Add both lowercase and uppercase
  'mp4', 'MP4',
  'avi', 'AVI',
  'mkv', 'MKV',
  'webm', 'WEBM'
];

// FIXED: Remove video extensions from source extensions
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  ext => !['mov', 'MOV', 'mp4', 'MP4', 'avi', 'AVI', 'mkv', 'MKV'].includes(ext)
);

// Add alias for attached_assets
config.resolver.alias = {
  '@assets': path.resolve(__dirname, 'src/attached_assets'),
};

// FIXED: Exclude .cache directory to prevent ENOSPC file watcher errors
config.resolver.blockList = [
  /\.cache\/.*/,
  /node_modules\/.*\/\.cache\/.*/,
];

// Configure watcher to ignore cache directories
config.watcher = {
  ...config.watcher,
  watchman: {
    deferStates: ['hg.update'],
  },
  healthCheck: {
    enabled: true,
  },
};

module.exports = config;