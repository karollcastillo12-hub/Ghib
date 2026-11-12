// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');


const config = getDefaultConfig(__dirname);


// Soluciona problemas con .cjs y Firebase
config.resolver.sourceExts.push('cjs');


// Evita errores de Firebase con Hermes en Expo 53
config.resolver.unstable_enablePackageExports = false;


module.exports = config;