/**
 * Email Templates and Utilities
 */

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Generate welcome email
 */
export function welcomeEmail(firstName: string): EmailTemplate {
  return {
    subject: 'Welcome to Delivery App!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Delivery App!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for joining Delivery App. We're excited to have you on board!</p>
            <p>With Delivery App, you can:</p>
            <ul>
              <li>Order from your favorite restaurants</li>
              <li>Track your delivery in real-time</li>
              <li>Enjoy fast and reliable service</li>
            </ul>
            <p>Get started by exploring restaurants near you!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Delivery App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Generate OTP email
 */
export function otpEmail(otp: string): EmailTemplate {
  return {
    subject: 'Your Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .otp-box { background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Generate order confirmation email
 */
export function orderConfirmationEmail(orderNumber: string, total: number): EmailTemplate {
  return {
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .order-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="order-details">
            <h2>Order #${orderNumber}</h2>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <p>Your order has been confirmed and is being prepared.</p>
            <p>You can track your order in the app.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
