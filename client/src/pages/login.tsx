import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import AuthModal from '@/components/auth-modal';

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  const handleClose = () => {
    setLocation('/');
  };

  return (
    <AuthModal 
      isOpen={true}
      onClose={handleClose}
      defaultMode="login"
    />
  );
}
