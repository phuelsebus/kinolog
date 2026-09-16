// Sentry braucht seine eigene Metro-Config-Erweiterung, um Source Maps beim
// Build korrekt zu annotieren (fuer lesbare Stacktraces statt minifiziertem
// Code im Sentry-Dashboard) - Standard-Setup laut Sentry-Doku fuer Expo.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
