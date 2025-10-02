import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not configured - payment features will be disabled');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
}) : null as any;

export async function createPaymentIntent(amount: number, description: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

export async function createPixPaymentIntent(amount: number, description: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      description,
      payment_method_types: ['pix'],
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating PIX payment intent:', error);
    throw error;
  }
}

export async function getPixPaymentDetails(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge', 'latest_charge.payment_method_details'],
    });

    if (!paymentIntent.latest_charge) {
      throw new Error('No charge associated with this payment intent');
    }

    const charge = paymentIntent.latest_charge as Stripe.Charge;
    const pixDetails = charge.payment_method_details?.pix as any;

    if (!pixDetails) {
      return null;
    }

    return {
      qrCode: pixDetails.qr_code || null,
      expiresAt: pixDetails.expires_at ? new Date(pixDetails.expires_at * 1000) : null,
    };
  } catch (error) {
    console.error('Error getting PIX payment details:', error);
    throw error;
  }
}

export async function checkPixPaymentStatus(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      status: paymentIntent.status,
      isPaid: paymentIntent.status === 'succeeded',
    };
  } catch (error) {
    console.error('Error checking PIX payment status:', error);
    throw error;
  }
}
