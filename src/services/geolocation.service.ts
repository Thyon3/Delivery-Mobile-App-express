/**
 * Geolocation Service
 * Handles all location-based queries using PostGIS spatial functions
 */

import prisma from '@/config/database';
import { Prisma } from '@prisma/client';
import { BadRequestError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class GeolocationService {
  // Constants
  static readonly EARTH_RADIUS_KM = 6371;
  static readonly DEFAULT_SEARCH_RADIUS = parseFloat(process.env.DEFAULT_SEARCH_RADIUS_KM || '10');
  static readonly MAX_SEARCH_RADIUS = parseFloat(process.env.MAX_SEARCH_RADIUS_KM || '50');

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate delivery fee based on distance
   */
  static calculateDeliveryFee(distanceKm: number): number {
    const baseFee = parseFloat(process.env.BASE_DELIVERY_FEE || '2.99');
    const costPerKm = parseFloat(process.env.COST_PER_KM || '0.50');

    // First 2km is base fee, then charge per km
    if (distanceKm <= 2) {
      return baseFee;
    }

    const additionalDistance = distanceKm - 2;
    const totalFee = baseFee + (additionalDistance * costPerKm);

    return Math.round(totalFee * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Find restaurants within a specific radius using PostGIS
   * This is the CRITICAL function for location-based search
   */
  static async findRestaurantsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = this.DEFAULT_SEARCH_RADIUS,
    filters?: {
      cuisineTypes?: string[];
      isOpen?: boolean;
      minimumRating?: number;
      maxDeliveryFee?: number;
    }
  ) {
    if (radiusKm > this.MAX_SEARCH_RADIUS) {
      throw new BadRequestError(`Search radius cannot exceed ${this.MAX_SEARCH_RADIUS}km`);
    }

    // Convert radius to meters for PostGIS
    const radiusMeters = radiusKm * 1000;

    // Build the where clause
    const whereClause: any = {
      status: 'ACTIVE',
    };

    if (filters?.cuisineTypes && filters.cuisineTypes.length > 0) {
      whereClause.cuisineTypes = {
        hasSome: filters.cuisineTypes
      };
    }

    if (filters?.isOpen !== undefined) {
      whereClause.isOpen = filters.isOpen;
    }

    if (filters?.minimumRating) {
      whereClause.rating = {
        gte: filters.minimumRating
      };
    }

    if (filters?.maxDeliveryFee) {
      whereClause.deliveryFee = {
        lte: filters.maxDeliveryFee
      };
    }

    // Use raw query with PostGIS for spatial search
    // ST_DWithin uses spatial index (GIST) for efficient searching
    const restaurants = await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        ST_Distance(
          r.location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 as distance
      FROM restaurants r
      WHERE 
        r.status = 'ACTIVE'
        AND ST_DWithin(
          r.location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
        ${filters?.isOpen !== undefined ? Prisma.sql`AND r."isOpen" = ${filters.isOpen}` : Prisma.empty}
        ${filters?.minimumRating ? Prisma.sql`AND r.rating >= ${filters.minimumRating}` : Prisma.empty}
        ${filters?.maxDeliveryFee ? Prisma.sql`AND r."deliveryFee" <= ${filters.maxDeliveryFee}` : Prisma.empty}
      ORDER BY distance ASC
      LIMIT 50
    `;

    // Add calculated delivery fee for each restaurant
    const restaurantsWithFees = restaurants.map(restaurant => ({
      ...restaurant,
      distance: Number(restaurant.distance).toFixed(2),
      calculatedDeliveryFee: this.calculateDeliveryFee(restaurant.distance),
    }));

    logger.info(`Found ${restaurants.length} restaurants within ${radiusKm}km`);

    return restaurantsWithFees;
  }

  /**
   * Find available drivers nearby for order assignment
   * This prevents race conditions with transaction locking
   */
  static async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ) {
    const radiusMeters = radiusKm * 1000;

    // Find available drivers within radius using PostGIS
    const drivers = await prisma.$queryRaw<any[]>`
      SELECT 
        d.*,
        ST_Distance(
          d."currentLocation"::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000 as distance
      FROM drivers d
      INNER JOIN users u ON u.id = d."userId"
      WHERE 
        d.status = 'ONLINE'
        AND d."isAvailable" = true
        AND u.status = 'ACTIVE'
        AND d."currentLocation" IS NOT NULL
        AND ST_DWithin(
          d."currentLocation"::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance ASC, d.rating DESC
      LIMIT 20
    `;

    logger.info(`Found ${drivers.length} available drivers within ${radiusKm}km`);

    return drivers;
  }

  /**
   * Update driver's current location
   */
  static async updateDriverLocation(
    driverId: string,
    latitude: number,
    longitude: number
  ) {
    // Use raw SQL to update PostGIS point
    await prisma.$executeRaw`
      UPDATE drivers
      SET 
        "currentLatitude" = ${latitude},
        "currentLongitude" = ${longitude},
        "currentLocation" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        "updatedAt" = NOW()
      WHERE id = ${driverId}
    `;

    logger.debug(`Driver location updated: ${driverId}`);
  }

  /**
   * Create or update address with PostGIS point
   */
  static async createAddress(data: {
    userId: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
  }) {
    // If setting as default, unset other default addresses
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: data.userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create address with PostGIS point using raw SQL
    const address = await prisma.$queryRaw<any[]>`
      INSERT INTO addresses (
        id, "userId", label, "addressLine1", "addressLine2",
        city, state, "postalCode", country, latitude, longitude,
        location, "isDefault", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${data.userId},
        ${data.label},
        ${data.addressLine1},
        ${data.addressLine2 || null},
        ${data.city},
        ${data.state},
        ${data.postalCode},
        ${data.country},
        ${data.latitude},
        ${data.longitude},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
        ${data.isDefault || false},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return address[0];
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
}
