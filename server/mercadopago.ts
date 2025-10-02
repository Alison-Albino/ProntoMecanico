import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('MERCADOPAGO_ACCESS_TOKEN não configurado - recursos de pagamento estarão desabilitados');
}

const client = accessToken ? new MercadoPagoConfig({ 
  accessToken,
  options: { timeout: 5000 }
}) : null;

const payment = client ? new Payment(client) : null;

export async function createPixPayment(amount: number, description: string, payerEmail: string) {
  if (!payment) {
    throw new Error('Mercado Pago não configurado');
  }

  try {
    const paymentData = {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
      },
    };

    const result = await payment.create({ body: paymentData });
    
    return {
      id: result.id?.toString() || '',
      status: result.status || 'pending',
      qrCode: result.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url || '',
      expirationDate: result.date_of_expiration,
    };
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw error;
  }
}

export async function getPaymentStatus(paymentId: string) {
  if (!payment) {
    throw new Error('Mercado Pago não configurado');
  }

  try {
    const result = await payment.get({ id: paymentId });
    
    return {
      id: result.id?.toString() || '',
      status: result.status || 'pending',
      isPaid: result.status === 'approved',
      statusDetail: result.status_detail || '',
    };
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);
    throw error;
  }
}

export async function createPixPayout(amount: number, pixKey: string, pixKeyType: string, description: string) {
  console.log(`Solicitação de saque PIX criada: R$ ${amount} para ${pixKey} (${pixKeyType})`);
  
  return {
    id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
  };
}
