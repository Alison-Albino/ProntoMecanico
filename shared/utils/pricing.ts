export interface PricingCalculation {
  isAfterHours: boolean;
  baseFee: number;
  platformFee: number;
  mechanicEarnings: number;
  totalPrice: number;
}

export function calculateServicePricing(requestDate: Date = new Date()): PricingCalculation {
  const hour = requestDate.getHours();
  
  const isAfterHours = hour < 6 || hour >= 18;
  
  const baseFee = isAfterHours ? 100 : 50;
  
  const platformFee = baseFee * 0.20;
  
  const mechanicEarnings = baseFee * 0.80;
  
  return {
    isAfterHours,
    baseFee,
    platformFee,
    mechanicEarnings,
    totalPrice: baseFee,
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
