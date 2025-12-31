/**
 * Payment Service - Stripe Integration with Webhook Support
 */

import Stripe from 'stripe';
import prisma from '@/config/database';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { BadRequestError, NotFoundError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';
import { JobService } from '@/config/bullmq';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export class PaymentService {
  /**
   * Create Stripe Payment Intent for order
   */
  static async createPaymentIntent(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        restaurant: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestError('Payment method must be CARD for online payment');
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      },
      description: `Order ${order.orderNumber} from ${order.restaurant.name}`,
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        amount: order.totalAmount,
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentId: paymentIntent.id,
        metadata: {
          clientSecret: paymentIntent.client_secret,
        },
      },
      update: {
        stripePaymentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        metadata: {
          clientSecret: paymentIntent.client_secret,
        },
      },
    });

    logger.info(`Payment intent created for order ${order.orderNumber}`);

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      payment,
    };
  }

  /**
   * Handle Stripe Webhook Events
   * This is CRITICAL - never trust frontend for payment confirmation
   */
  static async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestError('Invalid webhook signature');
    }

    logger.info(`Received webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      // Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

      // Get order details
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      // Send notification
      if (order) {
        await JobService.addNotificationJob({
          userId: order.customerId,
          title: 'Payment Successful',
          message: `Payment for order #${order.orderNumber} was successful`,
          type: 'ORDER_UPDATE',
          data: { orderId },
        });
      }
    });

    logger.info(`Payment successful for order ${orderId}`);
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;

    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      });

      // Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      // Get order details
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      // Send notification
      if (order) {
        await JobService.addNotificationJob({
          userId: order.customerId,
          title: 'Payment Failed',
          message: `Payment for order #${order.orderNumber} failed. Please try again.`,
          type: 'ORDER_UPDATE',
          data: { orderId },
        });
      }
    });

    logger.error(`Payment failed for order ${orderId}`);
  }

  /**
   * Handle refund
   */
  private static async handleRefund(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;

    await prisma.$transaction(async (tx) => {
      // Update payment status
      const payment = await tx.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
      });

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });

        // Update order status
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'REFUNDED',
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });

        // Get order details
        const order = await tx.order.findUnique({
          where: { id: payment.orderId },
        });

        // Send notification
        if (order) {
          await JobService.addNotificationJob({
            userId: order.customerId,
            title: 'Refund Processed',
            message: `Refund for order #${order.orderNumber} has been processed`,
            type: 'ORDER_UPDATE',
            data: { orderId: payment.orderId },
          });
        }
      }
    });

    logger.info(`Refund processed for payment ${paymentIntentId}`);
  }

  /**
   * Process refund
   */
  static async processRefund(orderId: string, reason?: string) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestError('Cannot refund uncompleted payment');
    }

    if (!payment.stripePaymentId) {
      throw new BadRequestError('No Stripe payment ID found');
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      reason: 'requested_by_customer',
      metadata: {
        orderId,
        reason: reason || 'Order cancelled',
      },
    });

    logger.info(`Refund initiated for order ${orderId}`);

    return refund;
  }

  /**
   * Handle cash payment
   */
  static async processCashPayment(orderId: string) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.paymentMethod !== PaymentMethod.CASH) {
        throw new BadRequestError('Order payment method is not CASH');
      }

      // Create payment record
      await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          amount: order.totalAmount,
          paymentMethod: PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
        update: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      // Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });
    });

    logger.info(`Cash payment processed for order ${orderId}`);
  }

  /**
   * Add funds to wallet
   */
  static async addToWallet(userId: string, amount: number, description: string) {
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const customer = await tx.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const currentBalance = Number(customer.walletBalance);
      const newBalance = currentBalance + amount;

      // Update wallet balance
      await tx.customer.update({
        where: { userId },
        data: {
          walletBalance: newBalance,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'CREDIT',
          description,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        },
      });
    });

    logger.info(`Added ${amount} to wallet for user ${userId}`);
  }

  /**
   * Deduct from wallet
   */
  static async deductFromWallet(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string
  ) {
    await prisma.$transaction(async (tx) => {
      // Get current balance
      const customer = await tx.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const currentBalance = Number(customer.walletBalance);

      if (currentBalance < amount) {
        throw new BadRequestError('Insufficient wallet balance');
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      await tx.customer.update({
        where: { userId },
        data: {
          walletBalance: newBalance,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'DEBIT',
          description,
          referenceId,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
        },
      });
    });

    logger.info(`Deducted ${amount} from wallet for user ${userId}`);
  }
}
