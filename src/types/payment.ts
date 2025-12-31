/**
 * Payment Type Definitions
 */

export interface PaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
}

export interface WebhookEvent {
  type: string;
  data: any;
  created: number;
}

export interface RefundRequest {
  orderId: string;
  amount: number;
  reason: string;
}

export interface WalletTransaction {
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  referenceId?: string;
}
