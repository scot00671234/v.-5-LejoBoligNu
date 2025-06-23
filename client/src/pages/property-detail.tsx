import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Bed, Home, Calendar, Heart, MessageCircle, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Property } from '@shared/schema';
import PropertyMap from '@/components/property-map';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id,
  });

  // Check if property is favorite
  const { data: favorites } = useQuery<any[]>({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated && user?.role === 'tenant' && !!property,
  });

  useEffect(() => {
    if (favorites && property) {
      setIsFavorite(favorites.some((f: any) => f.property.id === property.id));
    }
  }, [favorites, property]);

  // Get landlord info
  const { data: landlord } = useQuery<any>({
    queryKey: [`/api/users/${property?.landlordId}`],
    enabled: !!property?.landlordId && user?.id !== property?.landlordId,
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
        description: isFavorite ? "Boligen er fjernet fra dine favoritter" : "Boligen er tilføjet til dine favoritter",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved opdatering af favoritter",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipientId: number; message: string; propertyId: number }) => {
      return apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      toast({
        title: "Besked sendt",
        description: "Din besked er sendt til udlejeren",
      });
      setMessage('');
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved afsendelse af besked",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = () => {
    toggleFavoriteMutation.mutate();
  };

  const handleSendMessage = () => {
    if (!message.trim() || !property) return;
    sendMessageMutation.mutate({
      recipientId: property.landlordId,
      message: message.trim(),
      propertyId: property.id,
    });
  };

  const getAreaDescription = (address: string, city?: string | null, postalCode?: string | null) => {
    // Show only approximate area for privacy
    const parts = address.split(' ');
    if (parts.length > 1) {
      const streetName = parts.slice(0, -1).join(' '); // Remove house number
      if (city) {
        return `${streetName} området, ${city}`;
      }
      return `${streetName} området`;
    }
    return city || postalCode || 'Område ikke specificeret';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              {property.images && property.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-96 object-cover rounded-t-lg"
                  />
                  {property.images.length > 1 && (
                    <Badge className="absolute top-4 right-4 bg-black/50 text-white">
                      +{property.images.length - 1} flere billeder
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <Home className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                {isAuthenticated && user?.role === 'tenant' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={toggleFavoriteMutation.isPending}
                    className={isFavorite ? 'text-red-600 border-red-600' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
                  </Button>
                )}
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{getAreaDescription(property.address, property.city ?? undefined, property.postalCode ?? undefined)}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{property.rooms} {property.rooms === 1 ? 'værelse' : 'værelser'}</span>
                </div>
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{property.size} m²</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {property.availableFrom 
                      ? format(new Date(property.availableFrom), 'dd. MMM yyyy', { locale: da })
                      : 'Straks'
                    }
                  </span>
                </div>
                <div>
                  <Badge variant={property.available ? 'default' : 'secondary'}>
                    {property.available ? 'Ledig' : 'Optaget'}
                  </Badge>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Beskrivelse</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
              </div>

              {/* Map */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Lokation</h2>
                <PropertyMap property={property} className="h-64 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price and Contact */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-danish-blue mb-2">
                  {parseInt(property.price).toLocaleString('da-DK')} kr/måned
                </div>
                <Badge variant={property.available ? 'default' : 'secondary'} className="text-sm">
                  {property.available ? 'Ledig' : 'Optaget'}
                </Badge>
              </div>

              {/* Contact Information */}
              {isAuthenticated && user?.role === 'tenant' && user?.id !== property.landlordId && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Kontakt udlejer</h3>
                    
                    {/* Phone Access */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full mb-2"
                          onClick={() => setShowContactInfo(true)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Se telefonnummer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kontakt information</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {landlord?.phone ? (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Telefonnummer:</p>
                              <p className="text-lg font-semibold">{landlord.phone}</p>
                            </div>
                          ) : (
                            <p className="text-gray-600">Telefonnummer ikke tilgængeligt</p>
                          )}
                          {landlord?.email && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Email:</p>
                              <p className="text-lg font-semibold">{landlord.email}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Message */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Skriv en besked til udlejeren..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                        className="w-full bg-danish-blue hover:bg-blue-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {sendMessageMutation.isPending ? 'Sender...' : 'Send besked'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isAuthenticated && (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Log ind for at kontakte udlejeren</p>
                  <Link href="/login">
                    <Button className="bg-danish-blue hover:bg-blue-700">
                      Log ind
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Bolig information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Adresse:</span>
                  <span className="font-medium">{getAreaDescription(property.address, property.city ?? undefined, property.postalCode ?? undefined)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postnummer:</span>
                  <span className="font-medium">{property.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">By:</span>
                  <span className="font-medium">{property.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Størrelse:</span>
                  <span className="font-medium">{property.size} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Værelser:</span>
                  <span className="font-medium">{property.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ledig fra:</span>
                  <span className="font-medium">
                    {property.availableFrom 
                      ? format(new Date(property.availableFrom), 'dd. MMM yyyy', { locale: da })
                      : 'Straks'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}