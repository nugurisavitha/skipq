import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import AuthProvider from './context/AuthContext';
import CartProvider from './context/CartContext';
import SocketProvider from './context/SocketContext';
import NotificationProvider from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
            <CartProvider>
              <App />
              <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    style: {
                      background: '#10B981',
                    },
                  },
                  error: {
                    duration: 4000,
                    style: {
                      background: '#EF4444',
                    },
                  },
                }}
              />
            </CartProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
