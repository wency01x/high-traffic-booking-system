import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState } from 'react';

interface CheckoutFormProps {
  onSuccess: () => void;
  amount: number;
  bookingIds: number[]; 
}

export function CheckoutForm({ onSuccess, amount, bookingIds }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      // 1. GET CLIENT SECRET FROM YOUR FASTAPI
      const response = await fetch('http://127.0.0.1:8001/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100 }), 
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to initialize payment");
      }

      const clientSecret = data.clientSecret;

      // 2. CONFIRM THE PAYMENT WITH STRIPE
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed.");
      } else if (paymentIntent.status === 'succeeded') {
        
        // 3. CONFIRM THE SEATS PERMANENTLY
        try {
          const confirmationPromises = bookingIds.map(id => 
            fetch(`http://127.0.0.1:8001/bookings/${id}/pay`, {
              method: 'POST',
            })
          );

          const results = await Promise.all(confirmationPromises);
          const allSuccessful = results.every(res => res.ok);

          if (allSuccessful) {
            await onSuccess(); 
          } else {
            setErrorMessage("Payment worked, but some seats couldn't be updated.");
          }
        } catch (confirmErr) {
          setErrorMessage("Connection lost after payment. Please check your Booking History.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#0f1115] p-4 rounded-xl border border-white/10 ring-1 ring-white/5">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                '::placeholder': { color: '#6b7280' },
              },
              invalid: { color: '#ef4444' },
            },
          }} 
        />
      </div>

      {errorMessage && (
        <div className="text-emerald-400 text-xs font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/20 disabled:text-emerald-500/50 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            Securing Ticket...
          </>
        ) : (
          <>
            <iconify-icon icon="solar:shield-check-linear"></iconify-icon>
            Pay ${amount}.00 & Confirm
          </>
        )}
      </button>
      
      <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-medium">
        Encrypted by Stripe Secure
      </p>
    </form>
  );
}