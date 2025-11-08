#!/usr/bin/env node

/**
 * Generate Secrets Script
 * Generates secure random secrets for environment variables
 */

const crypto = require('crypto');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateApiKey(prefix = 'pk') {
  const random = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
  return `${prefix}_${random}`;
}

function displaySecret(name, value, description) {
  console.log(`${colors.cyan}${name}${colors.reset}`);
  console.log(`  ${description}`);
  console.log(`  ${colors.green}${value}${colors.reset}\n`);
}

function generateAllSecrets() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        PartPal Production Secrets Generator        ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}⚠ Store these secrets securely (1Password, etc.)${colors.reset}`);
  console.log(`${colors.yellow}⚠ Never commit these to version control${colors.reset}\n`);

  // JWT Secret
  const jwtSecret = generateSecret(32);
  displaySecret(
    'JWT_SECRET',
    jwtSecret,
    'Used for signing and verifying JWT tokens (minimum 32 characters)'
  );

  // Session Secret (if needed)
  const sessionSecret = generateSecret(32);
  displaySecret(
    'SESSION_SECRET',
    sessionSecret,
    'Used for encrypting session data'
  );

  // API Key (if needed for internal services)
  const apiKey = generateApiKey('sk');
  displaySecret(
    'API_KEY',
    apiKey,
    'Internal API key for service-to-service communication'
  );

  // Encryption Key (if needed)
  const encryptionKey = generateHex(32);
  displaySecret(
    'ENCRYPTION_KEY',
    encryptionKey,
    'Hex encryption key for sensitive data (64 characters hex)'
  );

  // Webhook Secret (if needed)
  const webhookSecret = generateSecret(24);
  displaySecret(
    'WEBHOOK_SECRET',
    webhookSecret,
    'Used for verifying webhook signatures'
  );

  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log('Add these to your Vercel environment variables:');
  console.log('1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables');
  console.log('2. Add each variable above');
  console.log('3. Select "Production" environment');
  console.log('4. Use different values for Preview/Development\n');

  console.log('Via CLI:');
  console.log('  vercel env add JWT_SECRET production');
  console.log('  (paste the generated value when prompted)\n');
}

function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        PartPal Secrets Generator (Interactive)     ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log('Select what to generate:');
  console.log('  1. JWT Secret (32 bytes base64)');
  console.log('  2. API Key (prefixed)');
  console.log('  3. Encryption Key (32 bytes hex)');
  console.log('  4. Random Secret (custom length)');
  console.log('  5. All secrets');
  console.log('  6. Exit\n');

  rl.question('Enter choice (1-6): ', (answer) => {
    console.log('');

    switch(answer.trim()) {
      case '1':
        const jwt = generateSecret(32);
        displaySecret('JWT_SECRET', jwt, 'JWT signing secret');
        break;
      case '2':
        rl.question('Enter prefix (default: sk): ', (prefix) => {
          const key = generateApiKey(prefix || 'sk');
          displaySecret('API_KEY', key, 'API key');
          rl.close();
        });
        return;
      case '3':
        const encKey = generateHex(32);
        displaySecret('ENCRYPTION_KEY', encKey, 'Hex encryption key');
        break;
      case '4':
        rl.question('Enter length in bytes (default: 32): ', (len) => {
          const length = parseInt(len) || 32;
          const secret = generateSecret(length);
          displaySecret('RANDOM_SECRET', secret, `${length} byte random secret`);
          rl.close();
        });
        return;
      case '5':
        rl.close();
        generateAllSecrets();
        return;
      case '6':
        console.log('Exiting...');
        rl.close();
        return;
      default:
        console.log('Invalid choice');
    }

    rl.close();
  });
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // No arguments, run interactive mode
  interactiveMode();
} else {
  const command = args[0];

  switch(command) {
    case 'jwt':
      console.log(generateSecret(32));
      break;
    case 'api-key':
      const prefix = args[1] || 'sk';
      console.log(generateApiKey(prefix));
      break;
    case 'encryption':
      console.log(generateHex(32));
      break;
    case 'random':
      const length = parseInt(args[1]) || 32;
      console.log(generateSecret(length));
      break;
    case 'all':
      generateAllSecrets();
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log(`
PartPal Secrets Generator

Usage:
  node generate-secrets.js [command] [options]

Commands:
  (no command)    Interactive mode
  jwt             Generate JWT secret (32 bytes base64)
  api-key [prefix] Generate API key with optional prefix
  encryption      Generate encryption key (32 bytes hex)
  random [length] Generate random secret of specified length
  all             Generate all recommended secrets
  help            Show this help message

Examples:
  node generate-secrets.js
  node generate-secrets.js jwt
  node generate-secrets.js api-key sk
  node generate-secrets.js random 64
  node generate-secrets.js all
      `);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run "node generate-secrets.js help" for usage');
      process.exit(1);
  }
}
