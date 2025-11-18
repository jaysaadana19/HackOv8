import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { setAuth } from '@/lib/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ disabled = false, onSuccess }) {
  const buttonRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google || !window.google.accounts || !GOOGLE_CLIENT_ID) {
        console.log('Google Sign In not ready yet, retrying...');
        setTimeout(initializeGoogleSignIn, 500);
        return;
      }

      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the button
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(
            buttonRef.current,
            {
              theme: 'outline',
              size: 'large',
              width: buttonRef.current.offsetWidth,
              text: 'signin_with',
              shape: 'rectangular',
            }
          );
        }

        console.log('Google Sign In initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Sign In:', error);
      }
    };

    // Start initialization after a short delay
    setTimeout(initializeGoogleSignIn, 500);
  }, []);

  const handleCredentialResponse = async (response) => {
    console.log('Google credential received');
    
    try {
      // Send the JWT credential to backend
      const backendResponse = await axios.post(`${API_URL}/auth/google/callback`, {
        credential: response.credential,
      });

      const { session_token, ...user } = backendResponse.data;
      setAuth(session_token, user);
      
      toast.success(`Welcome, ${user.name}!`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      const errorMessage = error.response?.data?.detail || 'Google sign in failed';
      toast.error(errorMessage);
    }
  };

  return (
    <div 
      ref={buttonRef}
      className="w-full h-12 flex items-center justify-center"
      style={{ minHeight: '48px' }}
    />
  );
}
