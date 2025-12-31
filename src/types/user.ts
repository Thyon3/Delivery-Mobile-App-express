/**
 * User Type Definitions
 */

export interface UserRegistration {
  email: string;
  password: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'DRIVER' | 'RESTAURANT_OWNER' | 'ADMIN';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

export interface AddressInput {
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
}
