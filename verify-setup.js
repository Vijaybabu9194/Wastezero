#!/usr/bin/env node

/**
 * WasteZero Setup Verification Script
 * Run: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 WasteZero Setup Verification\n');

const checks = [];

// Check Node.js version
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1));
checks.push({
  name: 'Node.js version',
  status: nodeMajor >= 16,
  message: nodeMajor >= 16 
    ? `✅ Node.js ${nodeVersion} (>= 16 required)` 
    : `❌ Node.js ${nodeVersion} - Please upgrade to v16 or higher`
});

// Check if backend directory exists
checks.push({
  name: 'Backend directory',
  status: fs.existsSync(path.join(__dirname, 'backend')),
  message: fs.existsSync(path.join(__dirname, 'backend'))
    ? '✅ Backend directory found'
    : '❌ Backend directory not found'
});

// Check if frontend directory exists
checks.push({
  name: 'Frontend directory',
  status: fs.existsSync(path.join(__dirname, 'frontend')),
  message: fs.existsSync(path.join(__dirname, 'frontend'))
    ? '✅ Frontend directory found'
    : '❌ Frontend directory not found'
});

// Check backend dependencies
const backendNodeModules = fs.existsSync(path.join(__dirname, 'backend', 'node_modules'));
checks.push({
  name: 'Backend dependencies',
  status: backendNodeModules,
  message: backendNodeModules
    ? '✅ Backend dependencies installed'
    : '⚠️  Backend dependencies not installed - Run: cd backend && npm install'
});

// Check frontend dependencies
const frontendNodeModules = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
checks.push({
  name: 'Frontend dependencies',
  status: frontendNodeModules,
  message: frontendNodeModules
    ? '✅ Frontend dependencies installed'
    : '⚠️  Frontend dependencies not installed - Run: cd frontend && npm install'
});

// Check backend .env file
const backendEnv = fs.existsSync(path.join(__dirname, 'backend', '.env'));
checks.push({
  name: 'Backend configuration',
  status: backendEnv,
  message: backendEnv
    ? '✅ Backend .env file found'
    : '⚠️  Backend .env not found - Run: cp backend/.env.example backend/.env'
});

// Check key backend files
const keyBackendFiles = [
  'server.js',
  'models/User.js',
  'models/Agent.js',
  'models/Pickup.js',
  'controllers/authController.js',
  'routes/authRoutes.js'
];

const missingBackendFiles = keyBackendFiles.filter(
  file => !fs.existsSync(path.join(__dirname, 'backend', file))
);

checks.push({
  name: 'Backend files',
  status: missingBackendFiles.length === 0,
  message: missingBackendFiles.length === 0
    ? '✅ All key backend files present'
    : `❌ Missing backend files: ${missingBackendFiles.join(', ')}`
});

// Check key frontend files
const keyFrontendFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/context/AuthContext.jsx',
  'src/pages/Login.jsx',
  'src/pages/UserDashboard.jsx'
];

const missingFrontendFiles = keyFrontendFiles.filter(
  file => !fs.existsSync(path.join(__dirname, 'frontend', file))
);

checks.push({
  name: 'Frontend files',
  status: missingFrontendFiles.length === 0,
  message: missingFrontendFiles.length === 0
    ? '✅ All key frontend files present'
    : `❌ Missing frontend files: ${missingFrontendFiles.join(', ')}`
});

// Print results
console.log('📋 Verification Results:\n');
checks.forEach(check => {
  console.log(check.message);
});

const allPassed = checks.every(check => check.status);
const allCriticalPassed = checks.slice(0, 3).every(check => check.status);

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('\n✨ Perfect! Your WasteZero setup is complete!\n');
  console.log('Next steps:');
  console.log('  1. Start MongoDB: brew services start mongodb-community');
  console.log('  2. Seed database: npm run seed');
  console.log('  3. Start backend: cd backend && npm run dev');
  console.log('  4. Start frontend: cd frontend && npm run dev');
  console.log('  5. Open http://localhost:5173\n');
} else if (allCriticalPassed) {
  console.log('\n⚠️  Setup incomplete. Please address the warnings above.\n');
  console.log('Quick fix:');
  console.log('  npm run install-all\n');
} else {
  console.log('\n❌ Setup verification failed. Please check errors above.\n');
}

console.log('📖 For detailed instructions, see QUICKSTART.md\n');

process.exit(allCriticalPassed ? 0 : 1);
