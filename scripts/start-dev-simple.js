#!/usr/bin/env node

/**
 * Simple development server for PartPal
 * Creates basic HTTP servers to showcase the applications
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple HTML template for PartPal applications
function createAppHTML(appName, port, description, features) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - PartPal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .feature {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .feature h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            margin: 0.25rem 0.25rem 0 0;
        }
        .price {
            color: #28a745;
            font-weight: bold;
        }
        .navigation {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            margin-right: 2rem;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background 0.3s;
        }
        .nav-links a:hover {
            background: rgba(255,255,255,0.2);
        }
        .status {
            background: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid #c3e6cb;
        }
        .mock-data {
            background: #fff3cd;
            color: #856404;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            border: 1px solid #ffeaa7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PartPal ${appName}</h1>
            <p>${description}</p>
        </div>

        <div class="navigation">
            <div class="nav-links">
                <a href="http://localhost:3000">Marketplace</a>
                <a href="http://localhost:3001">IMS Dashboard</a>
                <a href="http://localhost:3333/api">API</a>
            </div>
        </div>

        <div class="status">
            <strong>SUCCESS: ${appName} Development Server Running</strong><br>
            Port: ${port} | Status: Active | Environment: Development
        </div>

        <div class="card">
            <h2>${appName} Features</h2>
            <div class="features">
                ${features.map(feature => `
                    <div class="feature">
                        <h3>${feature.title}</h3>
                        <p>${feature.description}</p>
                        ${feature.tags ? feature.tags.map(tag => `<span class="badge">${tag}</span>`).join('') : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        ${appName === 'Marketplace' ? `
        <div class="card">
            <h2>Sample Parts Listing</h2>
            <div class="features">
                <div class="feature">
                    <h3>Alternator - Toyota Corolla 2018</h3>
                    <p>High-quality alternator in excellent condition. Tested and guaranteed.</p>
                    <span class="badge">EXCELLENT</span>
                    <span class="badge">Tested</span>
                    <p class="price" style="margin-top: 0.5rem;">R 850.00</p>
                    <p><small>Location: Cape Town, Western Cape</small></p>
                </div>
                <div class="feature">
                    <h3>Brake Pads - BMW 3 Series</h3>
                    <p>Front brake pads, low mileage, good condition.</p>
                    <span class="badge">GOOD</span>
                    <span class="badge">Low Mileage</span>
                    <p class="price" style="margin-top: 0.5rem;">R 450.00</p>
                    <p><small>Location: Johannesburg, Gauteng</small></p>
                </div>
            </div>
        </div>
        ` : ''}

        ${appName === 'IMS' ? `
        <div class="card">
            <h2>Dashboard Overview</h2>
            <div class="features">
                <div class="feature">
                    <h3>Inventory Stats</h3>
                    <p>Total Vehicles: <strong>45</strong></p>
                    <p>Total Parts: <strong>234</strong></p>
                    <p>Listed on Marketplace: <strong>189</strong></p>
                </div>
                <div class="feature">
                    <h3>Monthly Sales</h3>
                    <p>Parts Sold: <strong>28</strong></p>
                    <p>Revenue: <strong class="price">R 12,450.00</strong></p>
                    <p>Average Part Price: <strong>R 445.00</strong></p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="mock-data">
            <strong>Note:</strong> This is a development preview showing the ${appName} interface.
            The full application requires Node.js dependencies and database setup.
            This preview demonstrates the South African auto parts marketplace concept.
        </div>
    </div>
</body>
</html>
  `;
}

// Create servers
function createServer(port, appName, description, features) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', app: appName, port }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(createAppHTML(appName, port, description, features));
  });

  server.listen(port, () => {
    console.log(`${appName} running on http://localhost:${port}`);
  });

  return server;
}

// Application configurations
const apps = [
  {
    port: 3000,
    name: 'Marketplace',
    description: 'South African Auto Parts Marketplace - Find quality used parts',
    features: [
      {
        title: 'Part Search & Discovery',
        description: 'Search parts by vehicle make, model, year, or part name with advanced filtering',
        tags: ['Search', 'Filters', 'VIN']
      },
      {
        title: 'Location-Based Results',
        description: 'Find parts near you across all 9 South African provinces',
        tags: ['Geolocation', 'SA Provinces', 'Distance']
      },
      {
        title: 'Seller Contact',
        description: 'Direct contact with verified scrap yards and dismantlers',
        tags: ['WhatsApp', 'Phone', 'Email']
      },
      {
        title: 'Mobile Optimized',
        description: 'Fully responsive design optimized for mobile browsing',
        tags: ['Mobile', 'Touch', 'PWA']
      }
    ]
  },
  {
    port: 3001,
    name: 'IMS',
    description: 'Inventory Management System for Auto Parts Businesses',
    features: [
      {
        title: 'Vehicle Management',
        description: 'Track vehicles with VIN numbers, acquisition dates, and detailed specifications',
        tags: ['VIN Validation', 'Vehicle History', 'Specs']
      },
      {
        title: 'Parts Inventory',
        description: 'Manage parts with photos, conditions, pricing in ZAR, and physical locations',
        tags: ['Inventory', 'ZAR Pricing', 'Photos']
      },
      {
        title: 'Marketplace Integration',
        description: 'One-click publishing to marketplace with automatic sync',
        tags: ['Publishing', 'Sync', 'Toggle']
      },
      {
        title: 'Business Analytics',
        description: 'Sales reports, revenue tracking, and performance metrics',
        tags: ['Reports', 'Analytics', 'KPIs']
      }
    ]
  }
];

// API server
const apiServer = http.createServer((req, res) => {
  const url = req.url;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url === '/api' || url === '/api/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'PartPal API Server',
      version: '1.0.0',
      environment: 'development',
      endpoints: {
        parts: '/api/parts',
        search: '/api/parts/search',
        vehicles: '/api/vehicles',
        sellers: '/api/sellers',
        auth: '/api/auth'
      },
      status: 'running'
    }));
  } else if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else if (url.startsWith('/api/parts/search')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        parts: [
          {
            id: 'part-1',
            name: 'Alternator',
            description: 'Toyota Corolla alternator in excellent condition',
            price: 850,
            currency: 'ZAR',
            condition: 'EXCELLENT',
            vehicle: { year: 2018, make: 'Toyota', model: 'Corolla' },
            seller: { businessName: 'Cape Town Auto Parts', city: 'Cape Town', province: 'Western Cape' }
          }
        ],
        totalCount: 1
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', url }));
  }
});

// Start all servers
console.log('Starting PartPal Development Servers...\n');

// Start API server
apiServer.listen(3333, () => {
  console.log('API Server running on http://localhost:3333/api');
});

// Start application servers
apps.forEach(app => {
  createServer(app.port, app.name, app.description, app.features);
});

console.log('\nAll servers started successfully!');
console.log('Open your browser and visit:');
console.log('   - Marketplace: http://localhost:3000');
console.log('   - IMS Dashboard: http://localhost:3001');
console.log('   - API Docs: http://localhost:3333/api');
console.log('\nBoth applications are mobile-responsive and optimized for South African users.');
console.log('All pricing is displayed in ZAR (South African Rand).');
console.log('\nPress Ctrl+C to stop all servers.');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down PartPal servers...');
  process.exit(0);
});