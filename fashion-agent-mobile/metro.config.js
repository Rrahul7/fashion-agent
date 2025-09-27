const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix react-native resolution for mobile platforms
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure react-native resolves correctly for mobile
config.resolver.alias = {
  'react-native': 'react-native',
};

// Platform-specific extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx');

module.exports = config;
