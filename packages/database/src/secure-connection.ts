import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Secure database connection configuration
export interface SecureConnectionConfig {
  ssl: {
    enabled: boolean;
    mode: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
    certPath?: string;
    keyPath?: string;
    caPath?: string;
    rejectUnauthorized: boolean;
  };
  connection: {
    connectTimeout: number;
    queryTimeout: number;
    maxRetries: number;
    retryDelay: number;
  };
  monitoring: {
    logConnections: boolean;
    logQueries: boolean;
    logFailedConnections: boolean;
  };
}

export class SecureDatabaseConnection {
  private config: SecureConnectionConfig;

  constructor() {
    this.config = this.loadSecurityConfig();
  }

  // Load security configuration from environment
  private loadSecurityConfig(): SecureConnectionConfig {
    return {
      ssl: {
        enabled: process.env.SSL_MODE !== 'disable',
        mode: (process.env.SSL_MODE as any) || 'prefer',
        certPath: process.env.SSL_CERT_PATH,
        keyPath: process.env.SSL_KEY_PATH,
        caPath: process.env.SSL_CA_PATH,
        rejectUnauthorized: process.env.SSL_REJECT_UNAUTHORIZED !== 'false'
      },
      connection: {
        connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10000'),
        queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.DATABASE_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '1000')
      },
      monitoring: {
        logConnections: process.env.LOG_CONNECTIONS === 'true',
        logQueries: process.env.DATABASE_LOG_QUERIES === 'true',
        logFailedConnections: process.env.LOG_FAILED_CONNECTIONS !== 'false'
      }
    };
  }

  // Create secure Prisma client
  createSecureClient(): PrismaClient {
    const databaseUrl = this.buildSecureDatabaseUrl();

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: this.getLogConfig(),
      errorFormat: 'minimal'
    });

    // Add connection event handlers
    this.setupConnectionHandlers(prisma);

    return prisma;
  }

  // Build secure database URL with SSL parameters
  private buildSecureDatabaseUrl(): string {
    let databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Add SSL parameters if enabled
    if (this.config.ssl.enabled) {
      const urlObj = new URL(databaseUrl);

      // Add SSL mode
      urlObj.searchParams.set('sslmode', this.config.ssl.mode);

      // Add SSL certificate paths if provided
      if (this.config.ssl.certPath && fs.existsSync(this.config.ssl.certPath)) {
        urlObj.searchParams.set('sslcert', this.config.ssl.certPath);
      }

      if (this.config.ssl.keyPath && fs.existsSync(this.config.ssl.keyPath)) {
        urlObj.searchParams.set('sslkey', this.config.ssl.keyPath);
      }

      if (this.config.ssl.caPath && fs.existsSync(this.config.ssl.caPath)) {
        urlObj.searchParams.set('sslrootcert', this.config.ssl.caPath);
      }

      // Add connection timeout
      urlObj.searchParams.set('connect_timeout', (this.config.connection.connectTimeout / 1000).toString());

      databaseUrl = urlObj.toString();
    }

    return databaseUrl;
  }

  // Get logging configuration
  private getLogConfig(): any[] {
    const logs: any[] = ['error'];

    if (this.config.monitoring.logQueries) {
      logs.push('query');
    }

    if (this.config.monitoring.logConnections) {
      logs.push('info', 'warn');
    }

    return logs;
  }

  // Setup connection event handlers
  private setupConnectionHandlers(prisma: PrismaClient): void {
    // Handle connection events
    prisma.$on('beforeExit' as any, () => {
      if (this.config.monitoring.logConnections) {
        console.log('Database connection closing...');
      }
    });

    // In a real implementation, you'd handle more connection events
  }

  // Validate SSL certificates
  validateSSLCertificates(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.ssl.enabled) {
      return { valid: true, errors: [] };
    }

    // Check certificate files exist and are readable
    if (this.config.ssl.certPath) {
      if (!fs.existsSync(this.config.ssl.certPath)) {
        errors.push(`SSL certificate file not found: ${this.config.ssl.certPath}`);
      } else {
        try {
          fs.accessSync(this.config.ssl.certPath, fs.constants.R_OK);
        } catch {
          errors.push(`SSL certificate file not readable: ${this.config.ssl.certPath}`);
        }
      }
    }

    if (this.config.ssl.keyPath) {
      if (!fs.existsSync(this.config.ssl.keyPath)) {
        errors.push(`SSL key file not found: ${this.config.ssl.keyPath}`);
      } else {
        try {
          fs.accessSync(this.config.ssl.keyPath, fs.constants.R_OK);
        } catch {
          errors.push(`SSL key file not readable: ${this.config.ssl.keyPath}`);
        }
      }
    }

    if (this.config.ssl.caPath) {
      if (!fs.existsSync(this.config.ssl.caPath)) {
        errors.push(`SSL CA file not found: ${this.config.ssl.caPath}`);
      } else {
        try {
          fs.accessSync(this.config.ssl.caPath, fs.constants.R_OK);
        } catch {
          errors.push(`SSL CA file not readable: ${this.config.ssl.caPath}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Test database connection with retry logic
  async testConnection(prisma: PrismaClient): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
    retries: number;
  }> {
    let retries = 0;
    let lastError: string | undefined;

    while (retries <= this.config.connection.maxRetries) {
      try {
        const startTime = Date.now();

        // Test connection with a simple query
        await prisma.$queryRaw`SELECT 1`;

        const latency = Date.now() - startTime;

        if (this.config.monitoring.logConnections) {
          console.log(`Database connection successful (${latency}ms, ${retries} retries)`);
        }

        return {
          success: true,
          latency,
          retries
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown connection error';

        if (this.config.monitoring.logFailedConnections) {
          console.error(`Database connection attempt ${retries + 1} failed:`, lastError);
        }

        retries++;

        if (retries <= this.config.connection.maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.config.connection.retryDelay));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      retries
    };
  }

  // Get connection security status
  getSecurityStatus(): {
    sslEnabled: boolean;
    sslMode: string;
    certificatesValid: boolean;
    encryptionInTransit: boolean;
    authenticationStrong: boolean;
  } {
    const certValidation = this.validateSSLCertificates();

    return {
      sslEnabled: this.config.ssl.enabled,
      sslMode: this.config.ssl.mode,
      certificatesValid: certValidation.valid,
      encryptionInTransit: this.config.ssl.enabled && this.config.ssl.mode !== 'disable',
      authenticationStrong: this.config.ssl.mode === 'verify-full' || this.config.ssl.mode === 'verify-ca'
    };
  }
}

// Connection pool security wrapper
export class SecureConnectionPool {
  private connections: Map<string, PrismaClient> = new Map();
  private connectionLimits: Map<string, number> = new Map();
  private readonly maxConnectionsPerUser = 5;

  // Get connection for user with rate limiting
  async getConnection(userId: string): Promise<PrismaClient | null> {
    const currentConnections = this.connectionLimits.get(userId) || 0;

    if (currentConnections >= this.maxConnectionsPerUser) {
      console.warn(`Connection limit exceeded for user ${userId}`);
      return null;
    }

    let connection = this.connections.get(userId);

    if (!connection) {
      const secureConnection = new SecureDatabaseConnection();
      connection = secureConnection.createSecureClient();
      this.connections.set(userId, connection);
    }

    this.connectionLimits.set(userId, currentConnections + 1);
    return connection;
  }

  // Release connection
  releaseConnection(userId: string): void {
    const currentConnections = this.connectionLimits.get(userId) || 0;
    this.connectionLimits.set(userId, Math.max(0, currentConnections - 1));

    // Close connection if no active connections
    if (currentConnections <= 1) {
      const connection = this.connections.get(userId);
      if (connection) {
        connection.$disconnect();
        this.connections.delete(userId);
        this.connectionLimits.delete(userId);
      }
    }
  }

  // Get pool statistics
  getPoolStats(): {
    totalConnections: number;
    activeUsers: number;
    connectionsByUser: Record<string, number>;
  } {
    return {
      totalConnections: this.connections.size,
      activeUsers: this.connectionLimits.size,
      connectionsByUser: Object.fromEntries(this.connectionLimits.entries())
    };
  }

  // Cleanup idle connections
  cleanupIdleConnections(): void {
    // In a real implementation, track connection idle time and close unused connections
    console.log('Cleaning up idle database connections...');
  }
}

// Export instances
export const secureConnection = new SecureDatabaseConnection();
export const secureConnectionPool = new SecureConnectionPool();

export default SecureDatabaseConnection;