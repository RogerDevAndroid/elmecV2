#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify build for Expo Web...');

try {
  // Set environment variables
  process.env.EXPO_PLATFORM = 'web';
  process.env.NODE_ENV = 'production';
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🏗️ Building for web...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    console.error('❌ Build failed: dist directory not created');
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}