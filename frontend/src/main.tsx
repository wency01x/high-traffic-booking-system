import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- Add this import
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import App from './App'
import './index.css'

// public key for testing stripe fake payments
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
     <Elements stripe={stripePromise}>{/* <--- Wrap your App here */}
      <App />
     </Elements>
    </BrowserRouter>
  </React.StrictMode>
)