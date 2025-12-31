/**
 * Authentication Service
 * Handles user registration, login, token generation, and OTP verification
 */

import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '@/config/database';
import { UnauthorizedError, BadRequestError, ConflictError } from '@/utils/errors/AppError';
import { UserRole, UserStatus } from '@prisma/client';
import logger from '@/utils/logger';
import { JobService } from '@/config/bullmq';

export class AuthService {
  // Hash password using Argon2
  static async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  // Generate JWT Access Token
  static generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  // Generate JWT Refresh Token
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // Register new user
  static async register(data: {
    email: string;
    password: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone || '' }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictError('User with this email or phone already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user with role-specific profile
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          phone: data.phone,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: UserStatus.ACTIVE,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        }
      });

      // Create role-specific profile
      if (data.role === UserRole.CUSTOMER) {
        await tx.customer.create({
          data: { userId: newUser.id }
        });
      } else if (data.role === UserRole.DRIVER) {
        // Driver profile will be completed separately with license info
      } else if (data.role === UserRole.RESTAURANT_OWNER) {
        await tx.restaurantOwner.create({
          data: { userId: newUser.id }
        });
      }

      return newUser;
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    // Send welcome email (async job)
    await JobService.addEmailJob({
      to: user.email,
      subject: 'Welcome to Delivery App',
      template: 'welcome',
      context: { firstName: user.firstName }
    });

    logger.info(`User registered: ${user.email} (${user.role})`);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // Login user
  static async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    logger.info(`User logged in: ${user.email}`);

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };

      // Check if refresh token exists and is not revoked
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          isRevoked: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            }
          }
        }
      });

      if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (storedToken.user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('Account is not active');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  // Logout user
  static async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true }
    });

    logger.info('User logged out');
  }

  // Generate OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP for email verification
  static async sendEmailOTP(userId: string, email: string) {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    // Store OTP
    await prisma.otpVerification.create({
      data: {
        userId,
        otp,
        type: 'EMAIL',
        expiresAt,
      }
    });

    // Send OTP via email
    await JobService.addEmailJob({
      to: email,
      subject: 'Email Verification OTP',
      template: 'otp',
      context: { otp }
    });

    logger.info(`OTP sent to email: ${email}`);
  }

  // Send OTP for phone verification
  static async sendPhoneOTP(userId: string, phone: string) {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    // Store OTP
    await prisma.otpVerification.create({
      data: {
        userId,
        otp,
        type: 'PHONE',
        expiresAt,
      }
    });

    // Send OTP via SMS
    await JobService.addSMSJob({
      to: phone,
      message: `Your verification code is: ${otp}. Valid for 10 minutes.`
    });

    logger.info(`OTP sent to phone: ${phone}`);
  }

  // Verify OTP
  static async verifyOTP(userId: string, otp: string, type: 'EMAIL' | 'PHONE') {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId,
        otp,
        type,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    // Update user verification status
    if (type === 'EMAIL') {
      await prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true }
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { isPhoneVerified: true }
      });
    }

    logger.info(`${type} verified for user: ${userId}`);

    return true;
  }
}
