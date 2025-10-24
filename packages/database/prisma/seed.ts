import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories first
  const categories = await createCategories();
  console.log('✅ Categories created');

  // Create admin user
  const adminUser = await createAdminUser();
  console.log('✅ Admin user created');

  // Create sample sellers
  const sellers = await createSellers();
  console.log('✅ Sample sellers created');

  // Create sample vehicles
  const vehicles = await createVehicles(sellers);
  console.log('✅ Sample vehicles created');

  // Create sample parts
  await createParts(vehicles, categories);
  console.log('✅ Sample parts created');

  console.log('🎉 Database seeding completed!');
}

async function createCategories() {
  const mainCategories = [
    {
      name: 'Engine Components',
      description: 'Engine blocks, pistons, valves, etc.',
      children: [
        { name: 'Engine Blocks', description: 'Complete engine blocks' },
        { name: 'Pistons & Rings', description: 'Pistons and piston rings' },
        { name: 'Valves', description: 'Intake and exhaust valves' },
        { name: 'Camshafts', description: 'Camshafts and timing components' },
      ]
    },
    {
      name: 'Body Parts',
      description: 'Doors, panels, bumpers, etc.',
      children: [
        { name: 'Doors', description: 'Front and rear doors' },
        { name: 'Bumpers', description: 'Front and rear bumpers' },
        { name: 'Fenders', description: 'Front and rear fenders' },
        { name: 'Hoods', description: 'Engine hoods' },
      ]
    },
    {
      name: 'Electrical',
      description: 'Electrical components and wiring',
      children: [
        { name: 'Alternators', description: 'Alternators and charging systems' },
        { name: 'Starters', description: 'Starter motors' },
        { name: 'ECUs', description: 'Engine control units' },
        { name: 'Wiring Harnesses', description: 'Complete wiring harnesses' },
      ]
    },
    {
      name: 'Transmission',
      description: 'Gearboxes and drivetrain components',
      children: [
        { name: 'Manual Gearboxes', description: 'Manual transmission units' },
        { name: 'Automatic Gearboxes', description: 'Automatic transmission units' },
        { name: 'Clutches', description: 'Clutch assemblies' },
        { name: 'Drive Shafts', description: 'Drive and axle shafts' },
      ]
    }
  ];

  const createdCategories = new Map();

  for (const mainCat of mainCategories) {
    const parent = await prisma.category.create({
      data: {
        name: mainCat.name,
        description: mainCat.description,
        isActive: true
      }
    });

    createdCategories.set(mainCat.name, parent);

    for (const childCat of mainCat.children) {
      const child = await prisma.category.create({
        data: {
          name: childCat.name,
          description: childCat.description,
          parentId: parent.id,
          isActive: true
        }
      });
      createdCategories.set(childCat.name, child);
    }
  }

  return createdCategories;
}

async function createAdminUser() {
  return await prisma.user.create({
    data: {
      email: 'admin@partpal.co.za',
      name: 'System Administrator',
      password: '$2b$10$rOzWgXbKJ.N.TnG0WV8rO.5J7fV8pKlUzNgD2rD8wC6xV.sQ4rP.i', // "admin123"
      role: 'ADMIN',
      isVerified: true,
      emailVerified: new Date()
    }
  });
}

async function createSellers() {
  const sellerData = [
    {
      user: {
        email: 'mike@capetown-parts.co.za',
        name: 'Mike Johnson',
        password: '$2b$10$rOzWgXbKJ.N.TnG0WV8rO.5J7fV8pKlUzNgD2rD8wC6xV.sQ4rP.i',
        role: 'SELLER' as const,
        isVerified: true,
        emailVerified: new Date()
      },
      seller: {
        businessName: 'Cape Town Auto Parts',
        businessType: 'SCRAP_YARD' as const,
        description: 'Leading auto parts supplier in the Western Cape with over 20 years experience',
        street: '123 Industrial Road',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '7500',
        country: 'South Africa',
        latitude: -33.9249,
        longitude: 18.4241,
        phone: '+27 21 555 0123',
        whatsapp: '+27 82 555 0123',
        website: 'www.capetown-parts.co.za',
        isVerified: true,
        rating: 4.8,
        totalSales: 1250,
        subscriptionPlan: 'PROFESSIONAL' as const,
        businessHours: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '13:00' },
          sunday: { isOpen: false }
        }
      }
    },
    {
      user: {
        email: 'sarah@jhb-dismantlers.co.za',
        name: 'Sarah Williams',
        password: '$2b$10$rOzWgXbKJ.N.TnG0WV8rO.5J7fV8pKlUzNgD2rD8wC6xV.sQ4rP.i',
        role: 'SELLER' as const,
        isVerified: true,
        emailVerified: new Date()
      },
      seller: {
        businessName: 'Johannesburg Dismantlers',
        businessType: 'DISMANTLER' as const,
        description: 'Professional vehicle dismantling service specializing in German cars',
        street: '456 Reef Road',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
        latitude: -26.2041,
        longitude: 28.0473,
        phone: '+27 11 555 0456',
        whatsapp: '+27 83 555 0456',
        isVerified: true,
        rating: 4.6,
        totalSales: 890,
        subscriptionPlan: 'ENTERPRISE' as const,
        businessHours: {
          monday: { isOpen: true, openTime: '07:30', closeTime: '16:30' },
          tuesday: { isOpen: true, openTime: '07:30', closeTime: '16:30' },
          wednesday: { isOpen: true, openTime: '07:30', closeTime: '16:30' },
          thursday: { isOpen: true, openTime: '07:30', closeTime: '16:30' },
          friday: { isOpen: true, openTime: '07:30', closeTime: '16:30' },
          saturday: { isOpen: false },
          sunday: { isOpen: false }
        }
      }
    },
    {
      user: {
        email: 'peter@durban-spares.co.za',
        name: 'Peter van der Merwe',
        password: '$2b$10$rOzWgXbKJ.N.TnG0WV8rO.5J7fV8pKlUzNgD2rD8wC6xV.sQ4rP.i',
        role: 'SELLER' as const,
        isVerified: false
      },
      seller: {
        businessName: 'Durban Motor Spares',
        businessType: 'SCRAP_YARD' as const,
        description: 'Family-owned business serving KZN for 15 years',
        street: '789 Marine Drive',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4001',
        country: 'South Africa',
        latitude: -29.8587,
        longitude: 31.0218,
        phone: '+27 31 555 0789',
        isVerified: false,
        rating: 4.2,
        totalSales: 320,
        subscriptionPlan: 'STARTER' as const,
        businessHours: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '14:00' },
          sunday: { isOpen: false }
        }
      }
    }
  ];

  const sellers = [];

  for (const data of sellerData) {
    const user = await prisma.user.create({
      data: data.user
    });

    const { businessHours, ...sellerData } = data.seller;
    const seller = await prisma.seller.create({
      data: {
        ...sellerData,
        businessHours: businessHours as any, // Prisma will handle JSON conversion
        userId: user.id
      }
    });

    sellers.push({ user, seller });
  }

  return sellers;
}

async function createVehicles(sellers: any[]) {
  const vehicleData = [
    // Cape Town Auto Parts vehicles
    {
      sellerId: sellers[0].seller.id,
      vehicles: [
        {
          vin: '1HGBH41JXMN109186',
          year: 2018,
          make: 'BMW',
          model: '320i',
          variant: 'Sport Line',
          engineSize: '2.0L',
          fuelType: 'Petrol',
          transmission: 'Automatic',
          color: 'Alpine White',
          mileage: 85000,
          condition: 'GOOD' as const,
          acquisitionDate: new Date('2024-01-15')
        },
        {
          vin: '2FMDK3GC8DBA12345',
          year: 2016,
          make: 'Mercedes-Benz',
          model: 'C-Class',
          variant: 'C200',
          engineSize: '1.6L',
          fuelType: 'Petrol',
          transmission: 'Automatic',
          color: 'Obsidian Black',
          mileage: 120000,
          condition: 'FAIR' as const,
          acquisitionDate: new Date('2024-02-20')
        },
        {
          vin: '3VW2K7AJ9EM123456',
          year: 2014,
          make: 'Volkswagen',
          model: 'Golf',
          variant: 'GTI',
          engineSize: '2.0L',
          fuelType: 'Petrol',
          transmission: 'Manual',
          color: 'Tornado Red',
          mileage: 145000,
          condition: 'GOOD' as const,
          acquisitionDate: new Date('2024-03-10')
        }
      ]
    },
    // Johannesburg Dismantlers vehicles
    {
      sellerId: sellers[1].seller.id,
      vehicles: [
        {
          vin: '4JGDF2FE8EA123789',
          year: 2019,
          make: 'Audi',
          model: 'A4',
          variant: 'TFSI',
          engineSize: '2.0L',
          fuelType: 'Petrol',
          transmission: 'Automatic',
          color: 'Brilliant Black',
          mileage: 65000,
          condition: 'EXCELLENT' as const,
          acquisitionDate: new Date('2024-01-05')
        },
        {
          vin: '5NPE34AF0FH123456',
          year: 2017,
          make: 'BMW',
          model: 'X3',
          variant: 'xDrive20d',
          engineSize: '2.0L',
          fuelType: 'Diesel',
          transmission: 'Automatic',
          color: 'Mineral Grey',
          mileage: 95000,
          condition: 'GOOD' as const,
          acquisitionDate: new Date('2024-02-14')
        }
      ]
    },
    // Durban Motor Spares vehicles
    {
      sellerId: sellers[2].seller.id,
      vehicles: [
        {
          vin: '6G2VX12G85L123456',
          year: 2015,
          make: 'Toyota',
          model: 'Camry',
          variant: '2.5 VVT-i',
          engineSize: '2.5L',
          fuelType: 'Petrol',
          transmission: 'Automatic',
          color: 'Classic Silver',
          mileage: 180000,
          condition: 'FAIR' as const,
          acquisitionDate: new Date('2024-03-01')
        },
        {
          vin: '7FMCU0G64HUB12345',
          year: 2013,
          make: 'Ford',
          model: 'Focus',
          variant: '1.6 Trend',
          engineSize: '1.6L',
          fuelType: 'Petrol',
          transmission: 'Manual',
          color: 'Magnetic Grey',
          mileage: 210000,
          condition: 'POOR' as const,
          acquisitionDate: new Date('2024-03-15')
        }
      ]
    }
  ];

  const createdVehicles = [];

  for (const sellerVehicles of vehicleData) {
    for (const vehicleData of sellerVehicles.vehicles) {
      const vehicle = await prisma.vehicle.create({
        data: {
          ...vehicleData,
          sellerId: sellerVehicles.sellerId
        }
      });
      createdVehicles.push(vehicle);
    }
  }

  return createdVehicles;
}

async function createParts(vehicles: any[], categories: Map<string, any>) {
  const partsData = [
    // BMW 320i parts
    {
      vehicleId: vehicles[0].id,
      parts: [
        {
          name: 'Engine Block',
          partNumber: 'BMW-11002298005',
          description: 'Complete engine block assembly, 2.0L turbocharged, excellent condition with minimal wear',
          condition: 'EXCELLENT' as const,
          price: 15000,
          location: 'Bay A-15',
          categoryName: 'Engine Blocks',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/bmw-320i-engine-1.jpg', 'https://example.com/images/bmw-320i-engine-2.jpg']
        },
        {
          name: 'Front Bumper',
          partNumber: 'BMW-51117394468',
          description: 'Sport Line front bumper in Alpine White, minor scratches on lower section',
          condition: 'GOOD' as const,
          price: 2500,
          location: 'Bay B-08',
          categoryName: 'Bumpers',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/bmw-320i-bumper-1.jpg']
        },
        {
          name: 'Alternator',
          partNumber: 'BMW-12317823697',
          description: '180A alternator, tested and working perfectly',
          condition: 'EXCELLENT' as const,
          price: 1800,
          location: 'Shelf C-22',
          categoryName: 'Alternators',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/bmw-320i-alternator-1.jpg']
        }
      ]
    },
    // Mercedes C-Class parts
    {
      vehicleId: vehicles[1].id,
      parts: [
        {
          name: 'Automatic Gearbox',
          partNumber: 'MB-A2052702700',
          description: '7G-DCT automatic transmission, serviced recently, good working order',
          condition: 'GOOD' as const,
          price: 8500,
          location: 'Bay A-03',
          categoryName: 'Automatic Gearboxes',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/merc-gearbox-1.jpg', 'https://example.com/images/merc-gearbox-2.jpg']
        },
        {
          name: 'Driver Door',
          partNumber: 'MB-A2057200305',
          description: 'Left front door complete with window regulator and mirror, Obsidian Black metallic',
          condition: 'FAIR' as const,
          price: 1200,
          location: 'Bay B-12',
          categoryName: 'Doors',
          isListedOnMarketplace: false,
          images: ['https://example.com/images/merc-door-1.jpg']
        }
      ]
    },
    // VW Golf GTI parts
    {
      vehicleId: vehicles[2].id,
        {
          name: 'Manual Gearbox',
          partNumber: 'VW-02M300012FX',
          description: '6-speed manual transmission, 2.0L TSI compatible, excellent shifting',
          condition: 'EXCELLENT' as const,
          price: 4500,
          location: 'Bay A-07',
          categoryName: 'Manual Gearboxes',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/vw-gearbox-1.jpg']
        },
        {
          name: 'Turbocharger',
          partNumber: 'VW-06K145722H',
          description: 'K03 turbocharger, recently rebuilt, includes all gaskets',
          condition: 'EXCELLENT' as const,
          price: 3200,
          location: 'Shelf C-15',
          categoryName: 'Engine Components',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/vw-turbo-1.jpg', 'https://example.com/images/vw-turbo-2.jpg']
        }
      ]
    },
    // Audi A4 parts
    {
      vehicleId: vehicles[3].id,
      parts: [
        {
          name: 'Headlight Assembly',
          partNumber: 'AUDI-8W0941005',
          description: 'LED headlight assembly, right side, matrix beam technology',
          condition: 'EXCELLENT' as const,
          price: 5500,
          location: 'Shelf D-18',
          categoryName: 'Electrical',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/audi-headlight-1.jpg']
        }
      ]
    },
    // BMW X3 parts
    {
      vehicleId: vehicles[4].id,
      parts: [
        {
          name: 'Diesel Engine',
          partNumber: 'BMW-11002455345',
          description: '2.0L diesel engine, low mileage, complete with turbo and injection system',
          condition: 'EXCELLENT' as const,
          price: 18000,
          location: 'Bay A-20',
          categoryName: 'Engine Blocks',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/bmw-x3-engine-1.jpg', 'https://example.com/images/bmw-x3-engine-2.jpg']
        }
      ]
    },
    // Toyota Camry parts
    {
      vehicleId: vehicles[5].id,
      parts: [
        {
          name: 'Front Bumper',
          partNumber: 'TOY-5211906280',
          description: 'Front bumper assembly in Classic Silver, some fade on paint',
          condition: 'FAIR' as const,
          price: 800,
          location: 'Bay B-25',
          categoryName: 'Bumpers',
          isListedOnMarketplace: true,
          images: ['https://example.com/images/camry-bumper-1.jpg']
        },
        {
          name: 'Starter Motor',
          partNumber: 'TOY-2810031050',
          description: 'Starter motor for 2.5L VVT-i engine, tested working',
          condition: 'GOOD' as const,
          price: 450,
          location: 'Shelf C-30',
          categoryName: 'Starters',
          isListedOnMarketplace: false,
          images: ['https://example.com/images/camry-starter-1.jpg']
        }
      ]
    },
    // Ford Focus parts
    {
      vehicleId: vehicles[6].id,
      parts: [
        {
          name: 'Complete Wiring Harness',
          partNumber: 'FORD-1676498',
          description: 'Main engine wiring harness, some repairs needed but functional',
          condition: 'POOR' as const,
          price: 200,
          location: 'Shelf C-05',
          categoryName: 'Wiring Harnesses',
          isListedOnMarketplace: false,
          images: ['https://example.com/images/focus-wiring-1.jpg']
        }
      ]
    }
  ];

  for (const vehicleParts of partsData) {
    for (const partData of vehicleParts.parts) {
      const category = categories.get(partData.categoryName);

      await prisma.part.create({
        data: {
          vehicleId: vehicleParts.vehicleId,
          sellerId: vehicles.find(v => v.id === vehicleParts.vehicleId)?.sellerId,
          name: partData.name,
          partNumber: partData.partNumber,
          description: partData.description,
          condition: partData.condition,
          price: partData.price,
          location: partData.location,
          categoryId: category?.id,
          isListedOnMarketplace: partData.isListedOnMarketplace,
          images: partData.images,
          status: 'AVAILABLE'
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });