#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Validates that all required environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables by category
const requiredVars = {
  database: {
    title: 'Database Configuration',
    critical: true,
    vars: ['DATABASE_URL'],
  },
  auth: {
    title: 'Authentication',
    critical: true,
    vars: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
  },
  cloudinary: {
    title: 'Cloudinary (Image Storage)',
    critical: true,
    vars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  },
  redis: {
    title: 'Redis/Cache',
    critical: false,
    vars: ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'],
    optional: true,
  },
  email: {
    title: 'Email Service',
    critical: false,
    vars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'],
  },
  analytics: {
    title: 'Analytics',
    critical: false,
    vars: ['NEXT_PUBLIC_GA_TRACKING_ID'],
    optional: true,
  },
  monitoring: {
    title: 'Error Monitoring',
    critical: false,
    vars: ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'],
    optional: true,
  },
  security: {
    title: 'Security Configuration',
    critical: true,
    vars: ['NODE_ENV', 'CORS_ORIGIN', 'SECURE_COOKIES'],
  },
};

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠ Warning: .env.local not found${colors.reset}`);
    console.log(`Using process.env variables\n`);
    return process.env;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = { ...process.env };

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  });

  return env;
}

// Validate variable format and security
function validateVariable(name, value) {
  const issues = [];

  // Check if empty
  if (!value || value === 'your_' || value.includes('CHANGE_ME')) {
    issues.push('Empty or placeholder value');
  }

  // Specific validations
  if (name === 'DATABASE_URL') {
    if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
      issues.push('Should start with postgresql://');
    }
    if (!value.includes('sslmode=require') && process.env.NODE_ENV === 'production') {
      issues.push('Should include sslmode=require for production');
    }
  }

  if (name === 'JWT_SECRET') {
    if (value.length < 32) {
      issues.push('Should be at least 32 characters long');
    }
    if (value === 'your_super_secret_jwt_key_minimum_32_characters_long') {
      issues.push('Using example secret - CHANGE THIS!');
    }
  }

  if (name === 'REDIS_URL' && value) {
    if (!value.startsWith('redis://')) {
      issues.push('Should start with redis://');
    }
  }

  if (name === 'SMTP_PORT') {
    const port = parseInt(value);
    if (isNaN(port) || port < 1 || port > 65535) {
      issues.push('Invalid port number');
    }
  }

  if (name.includes('API_KEY') || name.includes('SECRET') || name.includes('PASSWORD')) {
    if (value.length < 16 && !name.includes('CLOUDINARY_CLOUD_NAME')) {
      issues.push('Seems too short for a secret');
    }
  }

  if (name === 'NODE_ENV') {
    if (!['development', 'production', 'test'].includes(value)) {
      issues.push('Should be development, production, or test');
    }
  }

  if (name === 'SECURE_COOKIES') {
    if (process.env.NODE_ENV === 'production' && value !== 'true') {
      issues.push('Should be true in production');
    }
  }

  return issues;
}

// Check for common security issues
function checkSecurity(env) {
  const warnings = [];

  // Check for development secrets in production
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET && env.JWT_SECRET.includes('dev')) {
      warnings.push('JWT_SECRET appears to be a development secret');
    }
    if (env.DATABASE_URL && env.DATABASE_URL.includes('localhost')) {
      warnings.push('DATABASE_URL points to localhost in production');
    }
  }

  // Check for exposed secrets
  const publicVars = Object.keys(env).filter(key => key.startsWith('NEXT_PUBLIC_'));
  publicVars.forEach(key => {
    if (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('PRIVATE')) {
      warnings.push(`${key} is public but contains sensitive keyword`);
    }
  });

  return warnings;
}

// Main verification function
function verifyEnvironment() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   PartPal Environment Variables Verification      ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);

  const env = loadEnv();

  let totalVars = 0;
  let configuredVars = 0;
  let criticalMissing = 0;
  let warnings = 0;

  // Check each category
  Object.entries(requiredVars).forEach(([category, config]) => {
    console.log(`${colors.blue}━━━ ${config.title} ${colors.reset}`);

    config.vars.forEach(varName => {
      totalVars++;
      const value = env[varName];
      const exists = !!value;

      if (exists) {
        configuredVars++;
        const issues = validateVariable(varName, value);

        if (issues.length > 0) {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${varName}: ${colors.yellow}${issues.join(', ')}${colors.reset}`);
          warnings++;
        } else {
          const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')
            ? '***' + value.slice(-4)
            : value.length > 40 ? value.slice(0, 37) + '...' : value;
          console.log(`  ${colors.green}✓${colors.reset} ${varName}: ${displayValue}`);
        }
      } else {
        if (config.critical && !config.optional) {
          console.log(`  ${colors.red}✗${colors.reset} ${varName}: ${colors.red}MISSING (CRITICAL)${colors.reset}`);
          criticalMissing++;
        } else {
          console.log(`  ${colors.yellow}⚠${colors.reset} ${varName}: ${colors.yellow}MISSING (optional)${colors.reset}`);
          warnings++;
        }
      }
    });

    console.log('');
  });

  // Security checks
  console.log(`${colors.blue}━━━ Security Analysis ${colors.reset}`);
  const securityWarnings = checkSecurity(env);

  if (securityWarnings.length === 0) {
    console.log(`  ${colors.green}✓${colors.reset} No security issues detected`);
  } else {
    securityWarnings.forEach(warning => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
      warnings++;
    });
  }
  console.log('');

  // Summary
  console.log(`${colors.cyan}━━━ Summary ${colors.reset}`);
  console.log(`  Total variables checked: ${totalVars}`);
  console.log(`  Configured: ${configuredVars} ${colors.green}✓${colors.reset}`);
  console.log(`  Critical missing: ${criticalMissing} ${criticalMissing > 0 ? colors.red + '✗' : colors.green + '✓'}${colors.reset}`);
  console.log(`  Warnings: ${warnings} ${warnings > 0 ? colors.yellow + '⚠' : colors.green + '✓'}${colors.reset}`);
  console.log('');

  // Final status
  if (criticalMissing > 0) {
    console.log(`${colors.red}╔═══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ✗ CRITICAL: Required variables missing           ║${colors.reset}`);
    console.log(`${colors.red}║     Add missing variables before deployment       ║${colors.reset}`);
    console.log(`${colors.red}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.yellow}╔═══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.yellow}║  ⚠ WARNING: Some issues detected                  ║${colors.reset}`);
    console.log(`${colors.yellow}║     Review warnings before deployment             ║${colors.reset}`);
    console.log(`${colors.yellow}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0); // Don't fail on warnings
  } else {
    console.log(`${colors.green}╔═══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✓ SUCCESS: All required variables configured     ║${colors.reset}`);
    console.log(`${colors.green}║     Environment is ready for deployment           ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0);
  }
}

// Run verification
if (require.main === module) {
  verifyEnvironment();
}

module.exports = { verifyEnvironment, loadEnv, validateVariable };
