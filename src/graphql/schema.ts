/**
 * GraphQL Schema Definition
 */

export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    
    # Restaurant queries
    restaurant(id: ID!): Restaurant
    restaurants(
      latitude: Float
      longitude: Float
      radius: Float
      cuisineTypes: [String!]
      limit: Int
    ): [Restaurant!]!
    
    # Order queries
    order(id: ID!): Order
    myOrders(status: OrderStatus, limit: Int): [Order!]!
    
    # Menu queries
    menuItem(id: ID!): MenuItem
    menuItems(restaurantId: ID!): [MenuItem!]!
    
    # Review queries
    reviews(restaurantId: ID!, limit: Int): [Review!]!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Order mutations
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
    cancelOrder(orderId: ID!, reason: String!): Order!
    
    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    updateReview(reviewId: ID!, input: UpdateReviewInput!): Review!
    
    # Restaurant mutations
    createRestaurant(input: CreateRestaurantInput!): Restaurant!
    updateRestaurant(restaurantId: ID!, input: UpdateRestaurantInput!): Restaurant!
    
    # Menu mutations
    createMenuItem(input: CreateMenuItemInput!): MenuItem!
    updateMenuItem(menuItemId: ID!, input: UpdateMenuItemInput!): MenuItem!
  }

  type Subscription {
    orderStatusChanged(orderId: ID!): Order!
    driverLocationUpdated(orderId: ID!): Location!
  }

  # Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String
    role: UserRole!
    profileImage: String
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    createdAt: DateTime!
  }

  type Restaurant {
    id: ID!
    name: String!
    description: String
    logo: String
    coverImage: String
    cuisineTypes: [String!]!
    rating: Float!
    totalReviews: Int!
    latitude: Float!
    longitude: Float!
    address: String!
    city: String!
    deliveryFee: Float!
    minimumOrder: Float!
    estimatedDeliveryTime: Int!
    isOpen: Boolean!
    categories: [Category!]!
    reviews: [Review!]!
  }

  type Category {
    id: ID!
    name: String!
    description: String
    displayOrder: Int!
    menuItems: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    image: String
    price: Float!
    discountPrice: Float
    isAvailable: Boolean!
    isVegetarian: Boolean!
    isVegan: Boolean!
    preparationTime: Int!
    addons: [MenuItemAddon!]!
  }

  type MenuItemAddon {
    id: ID!
    name: String!
    price: Float!
    isAvailable: Boolean!
  }

  type Order {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    subtotal: Float!
    deliveryFee: Float!
    tax: Float!
    totalAmount: Float!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    specialInstructions: String
    estimatedDeliveryTime: DateTime
    createdAt: DateTime!
    customer: User!
    restaurant: Restaurant!
    items: [OrderItem!]!
    delivery: Delivery
  }

  type OrderItem {
    id: ID!
    quantity: Int!
    price: Float!
    menuItem: MenuItem!
    addons: JSON
  }

  type Delivery {
    id: ID!
    driver: User
    distance: Float!
    driverEarnings: Float!
    assignedAt: DateTime
    pickedUpAt: DateTime
    deliveredAt: DateTime
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String
    response: String
    isVerified: Boolean!
    createdAt: DateTime!
    customer: User!
    restaurant: Restaurant!
  }

  type Location {
    latitude: Float!
    longitude: Float!
    timestamp: DateTime!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  # Enums
  enum UserRole {
    CUSTOMER
    DRIVER
    RESTAURANT_OWNER
    ADMIN
  }

  enum OrderStatus {
    PENDING
    ACCEPTED
    PREPARING
    READY_FOR_PICKUP
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentMethod {
    CARD
    CASH
    WALLET
    UPI
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    REFUNDED
  }

  # Input Types
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
    role: UserRole!
  }

  input CreateOrderInput {
    restaurantId: ID!
    items: [OrderItemInput!]!
    deliveryAddressId: ID!
    paymentMethod: PaymentMethod!
    specialInstructions: String
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
    addons: JSON
  }

  input CreateReviewInput {
    restaurantId: ID!
    orderId: ID
    rating: Int!
    comment: String
  }

  input UpdateReviewInput {
    rating: Int
    comment: String
  }

  input CreateRestaurantInput {
    name: String!
    description: String
    phone: String!
    email: String
    latitude: Float!
    longitude: Float!
    address: String!
    city: String!
    state: String!
    postalCode: String!
    country: String!
    cuisineTypes: [String!]!
    openingTime: String!
    closingTime: String!
    deliveryFee: Float
    minimumOrder: Float
  }

  input UpdateRestaurantInput {
    name: String
    description: String
    isOpen: Boolean
    deliveryFee: Float
    minimumOrder: Float
  }

  input CreateMenuItemInput {
    restaurantId: ID!
    categoryId: ID!
    name: String!
    description: String
    price: Float!
    discountPrice: Float
    isVegetarian: Boolean
    isVegan: Boolean
    preparationTime: Int
  }

  input UpdateMenuItemInput {
    name: String
    description: String
    price: Float
    discountPrice: Float
    isAvailable: Boolean
  }
`;
