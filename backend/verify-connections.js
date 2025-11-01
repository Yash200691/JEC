#!/usr/bin/env node

/**
 * Connection Verification Script
 * Checks all project connections and configurations
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Project Connections...\n');

// Load backend environment
dotenv.config({ path: path.resolve(__dirname, '.env') });

let allChecks = true;

// Check 1: Backend .env file
console.log('📋 Checking Backend Configuration:');
const requiredEnvVars = [
  'ETHEREUM_RPC_URL',
  'PRIVATE_KEY',
  'CONTRACT_ADDRESS',
  'IPFS_HOST',
  'IPFS_PORT',
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'your_private_key_here_without_0x_prefix') {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ❌ ${varName}: Missing or not configured`);
    allChecks = false;
  }
});

// Check 2: Contract ABI
console.log('\n📄 Checking Contract ABI:');
const abiPath = path.resolve(__dirname, 'contracts/SyntheticDataMarket.json');
if (fs.existsSync(abiPath)) {
  try {
    const abiFile = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    if (abiFile.abi && Array.isArray(abiFile.abi)) {
      console.log(`  ✅ ABI file found with ${abiFile.abi.length} functions/events`);
    } else {
      console.log('  ❌ ABI file exists but format is incorrect');
      allChecks = false;
    }
  } catch (error) {
    console.log(`  ❌ Error reading ABI file: ${error.message}`);
    allChecks = false;
  }
} else {
  console.log('  ❌ ABI file not found at:', abiPath);
  allChecks = false;
}

// Check 3: Frontend .env
console.log('\n🎨 Checking Frontend Configuration:');
const frontendEnvPath = path.resolve(__dirname, '../frontend/.env');
if (fs.existsSync(frontendEnvPath)) {
  console.log('  ✅ Frontend .env file exists');
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  const contractAddressMatch = frontendEnv.match(/VITE_CONTRACT_ADDRESS=(.+)/);
  const apiUrlMatch = frontendEnv.match(/VITE_API_URL=(.+)/);
  
  if (contractAddressMatch && contractAddressMatch[1] !== '0x0000000000000000000000000000000000000000') {
    console.log(`  ✅ Contract address configured: ${contractAddressMatch[1].substring(0, 10)}...`);
  } else {
    console.log('  ❌ Contract address not configured in frontend');
    allChecks = false;
  }
  
  if (apiUrlMatch) {
    console.log(`  ✅ API URL configured: ${apiUrlMatch[1]}`);
  } else {
    console.log('  ❌ API URL not configured');
    allChecks = false;
  }
} else {
  console.log('  ❌ Frontend .env file not found');
  console.log('  💡 Run: cd frontend && cp .env.example .env');
  allChecks = false;
}

// Check 4: Contract Address Match
console.log('\n🔗 Checking Contract Address Consistency:');
const backendAddress = process.env.CONTRACT_ADDRESS;
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  const frontendAddress = frontendEnv.match(/VITE_CONTRACT_ADDRESS=(.+)/)?.[1];
  
  if (backendAddress === frontendAddress) {
    console.log(`  ✅ Contract addresses match: ${backendAddress}`);
  } else {
    console.log('  ⚠️  Contract addresses DO NOT match:');
    console.log(`     Backend:  ${backendAddress}`);
    console.log(`     Frontend: ${frontendAddress}`);
    allChecks = false;
  }
}

// Check 5: Deployment Info
console.log('\n📦 Checking Deployment Info:');
const deploymentInfoPath = path.resolve(__dirname, '../deployment-info.json');
if (fs.existsSync(deploymentInfoPath)) {
  try {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    console.log('  ✅ Deployment info found:');
    console.log(`     Network: ${deploymentInfo.network}`);
    console.log(`     Contract: ${deploymentInfo.contractAddress}`);
    console.log(`     Deployed: ${new Date(deploymentInfo.deploymentDate).toLocaleString()}`);
  } catch (error) {
    console.log(`  ⚠️  Deployment info exists but couldn't read: ${error.message}`);
  }
} else {
  console.log('  ℹ️  Deployment info not found (run deployment first)');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecks) {
  console.log('✅ All checks passed! Your project is properly configured.');
  console.log('\n📝 Next steps:');
  console.log('  1. Start backend:  cd backend && npm start');
  console.log('  2. Start frontend: cd frontend && npm run dev');
  console.log('  3. Open browser:   http://localhost:5173');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\n💡 Common fixes:');
  console.log('  - Copy .env.example to .env in backend folder');
  console.log('  - Copy .env.example to .env in frontend folder');
  console.log('  - Run deployment script to generate ABI');
  console.log('  - Update contract addresses in both .env files');
}
console.log('='.repeat(60));

process.exit(allChecks ? 0 : 1);
