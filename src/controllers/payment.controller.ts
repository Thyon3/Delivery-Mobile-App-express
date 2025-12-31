/**
 * Payment Controller
 */

import { Request, Response } from 'express';
import { PaymentService } from '@/services/payment.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';

export class PaymentController {
  /**
   * @swagger
   * /payments/create-intent:
   *   post:
   *     tags: [Payments]
   *     summary: Create payment intent for order
   */
  static createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    const result = await PaymentService.createPaymentIntent(orderId);
    return ResponseHelper.success(res, result, 'Payment intent created successfully');
  });

  /**
   * @swagger
   * /payments/webhook:
   *   post:
   *     tags: [Payments]
   *     summary: Stripe webhook endpoint
   *     description: This endpoint is called by Stripe to notify payment events
   */
  static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    // Get raw body (important for webhook signature verification)
    const payload = req.body;

    const result = await PaymentService.handleWebhook(signature, payload);
    return res.json(result);
  });

  /**
   * @swagger
   * /payments/cash:
   *   post:
   *     tags: [Payments]
   *     summary: Process cash payment
   */
  static processCashPayment = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;

    await PaymentService.processCashPayment(orderId);
    return ResponseHelper.success(res, null, 'Cash payment processed successfully');
  });

  /**
   * @swagger
   * /payments/refund:
   *   post:
   *     tags: [Payments]
   *     summary: Process refund
   */
  static processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, reason } = req.body;

    const refund = await PaymentService.processRefund(orderId, reason);
    return ResponseHelper.success(res, refund, 'Refund processed successfully');
  });

  /**
   * @swagger
   * /payments/wallet/add:
   *   post:
   *     tags: [Payments]
   *     summary: Add funds to wallet
   */
  static addToWallet = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { amount, description } = req.body;

    await PaymentService.addToWallet(userId, amount, description);
    return ResponseHelper.success(res, null, 'Funds added to wallet successfully');
  });
}
