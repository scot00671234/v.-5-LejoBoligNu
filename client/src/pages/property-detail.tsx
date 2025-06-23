import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Heart, MessageCircle, Bed, Maximize, Calendar, MapPin, Euro } from 'lucide-react';
import { Link } from 'wouter';
import PropertyMap from '@/components/property-map';
import type { Property } from '@shared/schema';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id,
  });

  // Check if property is favorite
  const { data: favorites } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated && user?.role === 'tenant' && !!property,
  });

  useEffect(() => {
    if (favorites && property) {
      setIsFavorite(favorites.some((f: any) => f.property.id === property.id));
    }
  }, [favorites, property]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/messages', {
        toUserId: property?.landlordId,
        propertyId: property?.id,
        content,
      });
    },
    onSuccess: () => {
      toast({
        title: "Besked sendt",
        description: "Din besked er sendt til udlejeren.",
      });
      setMessage('');
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved afsendelse af besked.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        return apiRequest('DELETE', `/api/favorites/${property?.id}`);
      } else {
        return apiRequest('POST', '/api/favorites', { propertyId: property?.id });
      }
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? "Fjernet fra favoritter" : "Tilføjet til favoritter",
        description: isFavorite 
          ? "Boligen er fjernet fra dine favoritter" 
          : "Boligen er tilføjet til dine favoritter",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl. Prøv igen senere.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login påkrævet",
        description: "Du skal være logget ind for at sende beskeder.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Tom besked",
        description: "Skriv en besked før du sender.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate(message);
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated || user?.role !== 'tenant') {
      toast({
        title: "Login påkrævet",
        description: "Du skal være logget ind som lejer for at gemme favoritter.",
        variant: "destructive",
      });
      return;
    }

    toggleFavoriteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-32"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Bolig ikke fundet</h1>
            <p className="text-gray-600 mb-4">Den bolig du leder efter eksisterer ikke.</p>
            <Link href="/properties">
              <Button>Tilbage til boliger</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    return `${parseInt(price).toLocaleString('da-DK')} kr/måned`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ledig nu';
    return new Date(date).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/properties">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbage til boliger
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Property Images */}
          <div className="mb-6">
            {property.images && property.images.length > 0 ? (
              <div className="h-96 rounded-lg overflow-hidden">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Intet billede tilgængeligt</span>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1 text-gray-400" />
                  {property.rooms} {property.rooms === 1 ? 'værelse' : 'værelser'}
                </div>
                <div className="flex items-center">
                  <Maximize className="h-4 w-4 mr-1 text-gray-400" />
                  {property.size} m²
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  Ledig {formatDate(property.availableFrom)}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Beskrivelse</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Price and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-danish-blue mb-2">
                  {formatPrice(property.price)}
                </div>
                {property.available ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Ledig
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Ikke ledig
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {isAuthenticated && user?.role === 'tenant' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleToggleFavorite}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite ? 'Fjern fra favoritter' : 'Gem som favorit'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          {isAuthenticated && user?.role === 'tenant' && user.id !== property.landlordId && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <MessageCircle className="h-5 w-5 inline mr-2" />
                  Kontakt udlejer
                </h3>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Skriv din besked til udlejeren..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    className="w-full bg-danish-blue hover:bg-blue-700"
                  >
                    {sendMessageMutation.isPending ? 'Sender...' : 'Send besked'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <MapPin className="h-5 w-5 inline mr-2" />
                Lokation
              </h3>
              <PropertyMap property={property} />
            </CardContent>
          </Card>

          {!isAuthenticated && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Interesseret?
                </h3>
                <p className="text-gray-600 mb-4">
                  Log ind for at kontakte udlejeren og gemme boligen som favorit.
                </p>
                <div className="space-y-2">
                  <Link href="/login">
                    <Button className="w-full">Log ind</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="w-full">Opret konto</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
