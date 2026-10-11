export const CURRENCY = 'MAD';

export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()} ${CURRENCY}`;
};
