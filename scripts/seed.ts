/**
 * Database Seeding Script
 * Run: ts-node scripts/seed.ts
 */

import prisma from '../src/config/database';
import { AuthService } from '../src/services/auth.service';
import logger from '../src/utils/logger';

async function main() {
  logger.info('🌱 Starting database seeding...');

  try {
    // Create Admin User
    logger.info('Creating admin user...');
    const admin = await AuthService.register({
      email: 'admin@deliveryapp.com',
      password: 'Admin@123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    });
    logger.info(`✓ Admin created: ${admin.user.email}`);

    // Create Restaurant Owner
    logger.info('Creating restaurant owner...');
    const owner = await AuthService.register({
      email: 'owner@restaurant.com',
      password: 'Owner@123',
      firstName: 'Restaurant',
      lastName: 'Owner',
      role: 'RESTAURANT_OWNER',
    });
    logger.info(`✓ Restaurant owner created: ${owner.user.email}`);

    // Create Sample Restaurant
    logger.info('Creating sample restaurant...');
    const restaurant = await prisma.$queryRaw<any[]>`
      INSERT INTO restaurants (
        id, "ownerId", name, description, phone, email, status,
        latitude, longitude, location, address, city, state, 
        "postalCode", country, "cuisineTypes", "openingTime", "closingTime",
        "deliveryFee", "minimumOrder", "isOpen", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${owner.user.id},
        'The Great Restaurant',
        'Delicious food delivered to your door',
        '+1234567890',
        'info@greatrestaurant.com',
        'ACTIVE',
        40.7128,
        -74.0060,
        ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326),
        '123 Main St',
        'New York',
        'NY',
        '10001',
        'USA',
        ARRAY['Italian', 'Pizza', 'Pasta']::text[],
        '09:00',
        '22:00',
        4.99,
        15.00,
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    logger.info(`✓ Restaurant created: ${restaurant[0].name}`);

    // Create Menu Categories
    logger.info('Creating menu categories...');
    const categories = await prisma.category.createMany({
      data: [
        {
          restaurantId: restaurant[0].id,
          name: 'Pizzas',
          description: 'Fresh baked pizzas',
          displayOrder: 1,
        },
        {
          restaurantId: restaurant[0].id,
          name: 'Pasta',
          description: 'Homemade pasta dishes',
          displayOrder: 2,
        },
        {
          restaurantId: restaurant[0].id,
          name: 'Salads',
          description: 'Fresh salads',
          displayOrder: 3,
        },
      ],
    });
    logger.info(`✓ Created ${categories.count} categories`);

    // Get categories for menu items
    const pizzaCategory = await prisma.category.findFirst({
      where: { restaurantId: restaurant[0].id, name: 'Pizzas' },
    });

    // Create Menu Items
    logger.info('Creating menu items...');
    if (pizzaCategory) {
      await prisma.menuItem.createMany({
        data: [
          {
            restaurantId: restaurant[0].id,
            categoryId: pizzaCategory.id,
            name: 'Margherita Pizza',
            description: 'Classic tomato and mozzarella',
            price: 12.99,
            isVegetarian: true,
            preparationTime: 20,
          },
          {
            restaurantId: restaurant[0].id,
            categoryId: pizzaCategory.id,
            name: 'Pepperoni Pizza',
            description: 'Pepperoni and cheese',
            price: 14.99,
            preparationTime: 20,
          },
          {
            restaurantId: restaurant[0].id,
            categoryId: pizzaCategory.id,
            name: 'Vegetarian Pizza',
            description: 'Fresh vegetables and cheese',
            price: 13.99,
            isVegetarian: true,
            preparationTime: 20,
          },
        ],
      });
      logger.info('✓ Menu items created');
    }

    // Create Customer
    logger.info('Creating customer...');
    const customer = await AuthService.register({
      email: 'customer@example.com',
      password: 'Customer@123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'CUSTOMER',
    });
    logger.info(`✓ Customer created: ${customer.user.email}`);

    // Create Driver
    logger.info('Creating driver...');
    const driver = await AuthService.register({
      email: 'driver@example.com',
      password: 'Driver@123',
      firstName: 'Mike',
      lastName: 'Driver',
      phone: '+1234567891',
      role: 'DRIVER',
    });
    
    // Complete driver registration
    await prisma.driver.create({
      data: {
        userId: driver.user.id,
        licenseNumber: 'DL123456',
        vehicleType: 'BIKE',
        vehicleNumber: 'ABC-1234',
        currentLatitude: 40.7128,
        currentLongitude: -74.0060,
      },
    });
    logger.info(`✓ Driver created: ${driver.user.email}`);

    logger.info('');
    logger.info('✅ Database seeding completed successfully!');
    logger.info('');
    logger.info('Sample Credentials:');
    logger.info('─────────────────────────────────────');
    logger.info('Admin:      admin@deliveryapp.com / Admin@123');
    logger.info('Owner:      owner@restaurant.com / Owner@123');
    logger.info('Customer:   customer@example.com / Customer@123');
    logger.info('Driver:     driver@example.com / Driver@123');
    logger.info('─────────────────────────────────────');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
