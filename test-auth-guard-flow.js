#!/usr/bin/env node

/**
 * AuthGuard & Login Flow Test Script
 * Tests the complete authentication flow with the new EmailAuthPage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 TESTING: AuthGuard & EmailAuthPage Integration');
console.log('=====================================\n');

// Test 1: Verify AuthGuard component exists and has correct structure
console.log('📋 Test 1: AuthGuard Component Analysis');
console.log('---------------------------------------');

const authGuardPath = path.join(__dirname, 'src/components/AuthGuard.tsx');
if (fs.existsSync(authGuardPath)) {
    const authGuardContent = fs.readFileSync(authGuardPath, 'utf-8');
    
    // Check for key features
    const features = [
        { name: 'Race condition prevention', pattern: /navigationRef\.current/ },
        { name: 'Redirect loop detection', pattern: /detectRedirectLoop/ },
        { name: 'Loading state handling', pattern: /isLoading.*isReady/ },
        { name: 'Anti-flicker logic', pattern: /ANTI-FLICKER/ },
        { name: 'Development bypass', pattern: /isDevelopmentBypass/ },
        { name: 'Recent OTP check', pattern: /otpVerifiedAt/ },
        { name: 'Navigate component usage', pattern: /<Navigate to="\/auth"/ },
    ];
    
    features.forEach(feature => {
        const found = feature.pattern.test(authGuardContent);
        console.log(`  ${found ? '✅' : '❌'} ${feature.name}: ${found ? 'Present' : 'Missing'}`);
    });
    
    console.log('\n  📊 AuthGuard Analysis:');
    console.log(`     - File size: ${(authGuardContent.length / 1024).toFixed(1)}KB`);
    console.log(`     - Lines of code: ${authGuardContent.split('\n').length}`);
    console.log(`     - Complex logic detected: ${authGuardContent.includes('FIXED') ? 'Yes (has fixes)' : 'No'}`);
} else {
    console.log('  ❌ AuthGuard.tsx not found!');
}

// Test 2: Verify EmailAuthPage component exists and is simple
console.log('\n📋 Test 2: EmailAuthPage Component Analysis');
console.log('--------------------------------------------');

const emailAuthPath = path.join(__dirname, 'src/components/EmailAuthPage.tsx');
if (fs.existsSync(emailAuthPath)) {
    const emailAuthContent = fs.readFileSync(emailAuthPath, 'utf-8');
    
    // Check for simplicity indicators
    const simplicityChecks = [
        { name: 'Simple state management', pattern: /useState/, invert: false },
        { name: 'No complex hooks', pattern: /useCallback|useMemo/, invert: true },
        { name: 'Clean OTP handling', pattern: /handleOtpInput|handleOtpPaste/ },
        { name: 'Error handling', pattern: /error.*message/ },
        { name: 'Resend functionality', pattern: /resend.*cooldown/ },
        { name: 'Auto-focus behavior', pattern: /autoFocus|focus/ },
        { name: 'Form validation', pattern: /email.*validation|isValidEmail/ },
    ];
    
    simplicityChecks.forEach(check => {
        const found = check.pattern.test(emailAuthContent);
        const result = check.invert ? !found : found;
        console.log(`  ${result ? '✅' : '❌'} ${check.name}: ${result ? 'Good' : 'Needs attention'}`);
    });
    
    console.log('\n  📊 EmailAuthPage Analysis:');
    console.log(`     - File size: ${(emailAuthContent.length / 1024).toFixed(1)}KB`);
    console.log(`     - Lines of code: ${emailAuthContent.split('\n').length}`);
    console.log(`     - Complexity level: ${emailAuthContent.length < 15000 ? 'Simple' : 'Complex'}`);
    
    // Count state variables
    const stateMatches = emailAuthContent.match(/useState/g) || [];
    console.log(`     - State variables: ${stateMatches.length}`);
    
} else {
    console.log('  ❌ EmailAuthPage.tsx not found!');
}

// Test 3: Verify routing configuration
console.log('\n📋 Test 3: Routing Configuration');
console.log('---------------------------------');

const routingFiles = [
    'src/App.tsx',
    'src/config/routes.tsx'
];

let foundRouting = false;

routingFiles.forEach(routeFile => {
    const routePath = path.join(__dirname, routeFile);
    if (fs.existsSync(routePath)) {
        const routeContent = fs.readFileSync(routePath, 'utf-8');
        
        if (routeContent.includes('EmailAuthPage') || routeContent.includes('/auth')) {
            console.log(`  ✅ Found routing in ${routeFile}`);
            foundRouting = true;
            
            // Check for AuthGuard usage
            if (routeContent.includes('AuthGuard')) {
                console.log(`    - Uses AuthGuard: Yes`);
            }
            
            // Check for auth route
            if (routeContent.includes('path="/auth"') || routeContent.includes("path='/auth'")) {
                console.log(`    - Has /auth route: Yes`);
            }
        }
    }
});

if (!foundRouting) {
    console.log('  ❌ No routing configuration found!');
}

// Test 4: Check AuthContext integration
console.log('\n📋 Test 4: AuthContext Integration');
console.log('-----------------------------------');

const authContextPath = path.join(__dirname, 'src/contexts/AuthContext.tsx');
const authManagerPath = path.join(__dirname, 'src/contexts/auth/useAuthManager.ts');

if (fs.existsSync(authContextPath) && fs.existsSync(authManagerPath)) {
    console.log('  ✅ AuthContext files present');
    
    const authManagerContent = fs.readFileSync(authManagerPath, 'utf-8');
    
    // Check for modular design
    const moduleChecks = [
        { name: 'Modular hooks', pattern: /useAuthState|useAuthValidation|useAuthLifecycle/ },
        { name: 'Cache management', pattern: /queryClient|clearCaches/ },
        { name: 'Debug support', pattern: /__DEBUG_AUTH__/ },
        { name: 'Anti-flicker logic', pattern: /ANTI-FLICKER/ },
    ];
    
    moduleChecks.forEach(check => {
        const found = check.pattern.test(authManagerContent);
        console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${found ? 'Present' : 'Missing'}`);
    });
    
} else {
    console.log('  ❌ AuthContext files missing!');
}

// Test 5: Environment and configuration checks
console.log('\n📋 Test 5: Environment Configuration');
console.log('------------------------------------');

const envExamplePath = path.join(__dirname, '.env.example');
const packageJsonPath = path.join(__dirname, 'package.json');

if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    
    const envChecks = [
        { name: 'Supabase URL', pattern: /VITE_SUPABASE_URL/ },
        { name: 'Supabase Anon Key', pattern: /VITE_SUPABASE_ANON_KEY/ },
        { name: 'Dev bypass option', pattern: /VITE_DEV_BYPASS_AUTH/ },
    ];
    
    envChecks.forEach(check => {
        const found = check.pattern.test(envContent);
        console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${found ? 'Configured' : 'Missing'}`);
    });
} else {
    console.log('  ❌ .env.example not found!');
}

if (fs.existsSync(packageJsonPath)) {
    const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`  ✅ Project: ${packageContent.name}`);
    console.log(`  ✅ Dev server script: ${packageContent.scripts?.dev || 'Not found'}`);
}

// Test 6: Check for test files and documentation
console.log('\n📋 Test 6: Documentation & Testing');
console.log('-----------------------------------');

const docFiles = [
    { path: 'test-auth-guard-flow.js', name: 'This test script' },
    { path: 'docs/auth-flow-test.md', name: 'Auth flow documentation' },
    { path: 'src/pages/EmailAuthPage.backup.tsx', name: 'Backup of old auth page' },
];

docFiles.forEach(doc => {
    const docPath = path.join(__dirname, doc.path);
    const exists = fs.existsSync(docPath);
    console.log(`  ${exists ? '✅' : '⚠️ '} ${doc.name}: ${exists ? 'Present' : 'Not found'}`);
});

// Summary and recommendations
console.log('\n📋 Summary & Next Steps');
console.log('=======================');
console.log('✅ COMPLETED: AuthGuard complexity analysis');
console.log('✅ COMPLETED: EmailAuthPage simplicity verification');
console.log('✅ COMPLETED: Routing configuration check');
console.log('✅ COMPLETED: AuthContext integration review');
console.log('');
console.log('🎯 MANUAL TESTING REQUIRED:');
console.log('1. Open http://localhost:5174 in browser');
console.log('2. Verify redirect to /auth when not logged in');
console.log('3. Test email input → OTP flow → login success');
console.log('4. Test tab switching during OTP (should NOT persist - new simple flow)');
console.log('5. Test direct access to protected routes');
console.log('6. Test logout → redirect to auth');
console.log('');
console.log('🔧 DEBUGGING TIPS:');
console.log('- Open browser dev tools for console logs');
console.log('- Look for AuthGuard render count logs');
console.log('- Check Network tab for Supabase auth calls');
console.log('- Use localStorage inspection for debug data');
console.log('');
console.log('🚀 DEV SERVER: http://localhost:5174');
console.log('🔍 Test completed at:', new Date().toISOString());