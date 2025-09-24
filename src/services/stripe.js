import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createPaymentSession({
  enrollmentId,
  amount,
  currency = 'EUR',
  description,
  customerEmail,
  returnUrl,
  metadata = {},
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: returnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/courses`,
      metadata: {
        enrollmentId,
        ...metadata,
      },
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  } catch (error) {
    console.error('Stripe payment session creation failed:', error);
    throw new Error('Failed to create payment session');
  }
}

export async function verifyWebhookSignature(body, signature) {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

export { stripe };
