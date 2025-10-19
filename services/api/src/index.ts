import dotenv from 'dotenv';
import app from './app';
import { databaseManager } from './utils/database';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3333;

// Initialize and start server
async function startServer() {
  try {
    // Check database connection
    console.log('Checking database connection...');
    const isDbConnected = await databaseManager.checkConnection();

    if (!isDbConnected) {
      console.error('ERROR: Database connection failed');
      process.exit(1);
    }

    console.log('SUCCESS: Database connection established');

    // Start server
    app.listen(PORT, () => {
      console.log(`API Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Admin panel: http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error('ERROR: Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;