import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant' as 'tenant' | 'landlord',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        toast({
          title: "Velkommen tilbage!",
          description: "Du er nu logget ind.",
        });
      } else {
        if (!formData.acceptTerms) {
          toast({
            title: "Vilkår ikke accepteret",
            description: "Du skal acceptere vilkårene for at oprette en konto.",
            variant: "destructive",
          });
          return;
        }
        
        await register(formData.name, formData.email, formData.password, formData.role);
        toast({
          title: "Konto oprettet!",
          description: "Din konto er blevet oprettet og du er nu logget ind.",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Der opstod en fejl. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'tenant',
      acceptTerms: false,
    });
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Log ind' : 'Opret konto'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Jeg er:
                </Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value: 'tenant' | 'landlord') => 
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="tenant" />
                    <Label htmlFor="tenant">Lejer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landlord" id="landlord" />
                    <Label htmlFor="landlord">Udlejer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Fulde navn
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Dit fulde navn"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="din@email.dk"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Adgangskode
            </Label>
            <Input
              id="password"
              type="password"
              required
              placeholder={mode === 'register' ? 'Mindst 8 tegn' : '••••••••'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          {mode === 'register' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                }
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                Jeg accepterer{' '}
                <a href="#" className="text-danish-blue hover:underline">vilkårene</a>
                {' '}og{' '}
                <a href="#" className="text-danish-blue hover:underline">privatlivspolitikken</a>
              </Label>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-danish-blue text-white hover:bg-blue-700 font-medium"
          >
            {isLoading ? 'Behandler...' : (mode === 'login' ? 'Log ind' : 'Opret konto')}
          </Button>

          {mode === 'login' && (
            <div className="text-center">
              <a href="#" className="text-danish-blue hover:underline text-sm">
                Glemt adgangskode?
              </a>
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? 'Har du ikke en konto endnu?' : 'Har du allerede en konto?'}
          </p>
          <Button 
            variant="link" 
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-danish-blue hover:underline font-medium"
          >
            {mode === 'login' ? 'Opret konto her' : 'Log ind her'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
