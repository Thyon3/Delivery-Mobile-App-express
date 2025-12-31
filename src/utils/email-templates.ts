/**
 * Additional Email Templates
 */

/**
 * Order placed email
 */
export function orderPlacedEmail(orderNumber: string, customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-number { font-size: 24px; font-weight: bold; color: #4CAF50; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${customerName},</h2>
          <p>Thank you for your order!</p>
          <p>Your order number is: <span class="order-number">${orderNumber}</span></p>
          <p>We'll notify you when your order is ready for delivery.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Order delivered email
 */
export function orderDeliveredEmail(orderNumber: string, customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Delivered!</h1>
        </div>
        <div class="content">
          <h2>Hi ${customerName},</h2>
          <p>Your order <strong>${orderNumber}</strong> has been delivered!</p>
          <p>We hope you enjoyed your meal. Please consider leaving a review!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Password reset email
 */
export function passwordResetEmail(resetLink: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <p><a href="${resetLink}" class="button">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}
