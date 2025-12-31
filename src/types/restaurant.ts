/**
 * Restaurant Type Definitions
 */

export interface CreateRestaurantInput {
  ownerId: string;
  name: string;
  description?: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  cuisineTypes: string[];
  openingTime: string;
  closingTime: string;
  deliveryFee?: number;
  minimumOrder?: number;
}

export interface RestaurantFilters {
  latitude?: number;
  longitude?: number;
  radius?: number;
  cuisineTypes?: string[];
  isOpen?: boolean;
  minRating?: number;
  maxDeliveryFee?: number;
}

export interface MenuItemInput {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  preparationTime?: number;
  addons?: MenuItemAddonInput[];
}

export interface MenuItemAddonInput {
  name: string;
  price: number;
}
