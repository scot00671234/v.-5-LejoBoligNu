import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Bed, Maximize, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import type { Property } from '@shared/schema';

interface PropertyCardProps {
  property: Property;
  isFavorite?: boolean;
  onFavoriteChange?: () => void;
}

export default function PropertyCard({ property, isFavorite = false, onFavoriteChange }: PropertyCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [favorite, setFavorite] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || user?.role !== 'tenant') {
      toast({
        title: "Login påkrævet",
        description: "Du skal være logget ind som lejer for at gemme favoritter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (favorite) {
        await apiRequest('DELETE', `/api/favorites/${property.id}`);
        setFavorite(false);
        toast({
          title: "Fjernet fra favoritter",
          description: "Boligen er fjernet fra dine favoritter",
        });
      } else {
        await apiRequest('POST', '/api/favorites', { propertyId: property.id });
        setFavorite(true);
        toast({
          title: "Tilføjet til favoritter",
          description: "Boligen er tilføjet til dine favoritter",
        });
      }
      onFavoriteChange?.();
    } catch (error) {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    return `${parseInt(price).toLocaleString('da-DK')} kr`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ledig nu';
    return new Date(date).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">Intet billede</div>
          )}
        </div>
        
        {isAuthenticated && user?.role === 'tenant' && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full p-0 shadow-md hover:bg-gray-100"
            onClick={toggleFavorite}
            disabled={loading}
          >
            <Heart 
              className={`h-4 w-4 ${
                favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              }`} 
            />
          </Button>
        )}
        
        {property.createdAt && new Date().getTime() - new Date(property.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-warm-amber text-white px-2 py-1 rounded text-sm font-medium">
              Nyt
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {property.title}
          </h3>
          <span className="text-lg font-bold text-danish-blue whitespace-nowrap ml-2">
            {formatPrice(property.price)}
          </span>
        </div>
        
        <p className="text-gray-600 mb-3 text-sm line-clamp-1">
          {property.address}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {property.rooms} {property.rooms === 1 ? 'værelse' : 'værelser'}
          </span>
          <span className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            {property.size} m²
          </span>
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(property.availableFrom)}
          </span>
        </div>
        
        <Link href={`/properties/${property.id}`}>
          <Button className="w-full bg-danish-blue text-white hover:bg-blue-700">
            Se bolig
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
