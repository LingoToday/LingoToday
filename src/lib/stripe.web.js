export const StripeProvider = ({ children }) => children;

export const CardField = () => null;

export const useStripe = () => ({
  createPaymentMethod: async () => ({ error: null, paymentMethod: null }),
});

export const useConfirmPayment = () => ({
  confirmPayment: async () => ({ error: null, paymentIntent: null }),
});
