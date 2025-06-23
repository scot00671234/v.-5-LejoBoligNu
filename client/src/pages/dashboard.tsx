import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertPropertySchema } from '@shared/schema';
import { Plus, Edit, Trash2, Eye, Home, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import ImageUpload from '@/components/image-upload';
import type { Property } from '@shared/schema';
import { z } from 'zod';

const propertyFormSchema = insertPropertySchema.extend({
  price: z.string().min(1, 'Pris er påkrævet'),
  availableFrom: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Denmark'),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

export default function Dashboard() {
  const { section } = useParams<{ section?: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const isCreateSection = section === 'create-property';
  const activeTab = isCreateSection ? 'create' : 'properties';

  const { data: myProperties, isLoading, refetch } = useQuery<Property[]>({
    queryKey: ['/api/properties', { landlordId: user?.id }],
    enabled: isAuthenticated && user?.role === 'landlord',
  });

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'Denmark',
      price: '',
      rooms: 1,
      size: 50,
      available: true,
      availableFrom: '',
      images: [],
      landlordId: user?.id || 0,
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        ...data,
        price: data.price.toString(),
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        landlordId: user!.id,
      };
      return apiRequest('POST', '/api/properties', propertyData);
    },
    onSuccess: () => {
      toast({
        title: "Bolig oprettet",
        description: "Din boligannonce er blevet oprettet.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      refetch();
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved oprettelse af boligen.",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PropertyFormData> }) => {
      const propertyData = {
        ...data,
        price: data.price?.toString(),
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      };
      return apiRequest('PUT', `/api/properties/${id}`, propertyData);
    },
    onSuccess: () => {
      toast({
        title: "Bolig opdateret",
        description: "Din boligannonce er blevet opdateret.",
      });
      setEditingProperty(null);
      form.reset();
      refetch();
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved opdatering af boligen.",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/properties/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Bolig slettet",
        description: "Din boligannonce er blevet slettet.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved sletning af boligen.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  const startEdit = (property: Property) => {
    setEditingProperty(property);
    form.reset({
      title: property.title,
      description: property.description,
      address: property.address,
      postalCode: property.postalCode || '',
      city: property.city || '',
      country: property.country || 'Denmark',
      price: property.price,
      rooms: property.rooms,
      size: property.size,
      available: property.available ?? false,
      availableFrom: property.availableFrom ? 
        new Date(property.availableFrom).toISOString().split('T')[0] : '',
      images: property.images || [],
      landlordId: property.landlordId,
    });
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    form.reset();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se dit dashboard.</p>
            <Link href="/login">
              <Button>Log ind</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'landlord') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Adgang nægtet</h1>
            <p className="text-gray-600 mb-4">Du skal være udlejer for at få adgang til dette dashboard.</p>
            <Link href="/">
              <Button>Tilbage til forsiden</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Udlejer Dashboard</h1>
        <p className="text-gray-600">Administrer dine boligannoncer</p>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="properties">Mine boliger</TabsTrigger>
          <TabsTrigger value="create">Opret ny bolig</TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="h-4 w-4 mr-2" />
            Beskeder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Mine boligannoncer</h2>
              <Link href="/dashboard/create-property">
                <Button className="bg-danish-blue hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Opret ny bolig
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !myProperties || myProperties.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen boliger endnu</h3>
                  <p className="text-gray-600 mb-4">Opret din første boligannonce for at komme i gang.</p>
                  <Link href="/dashboard/create-property">
                    <Button className="bg-danish-blue hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Opret bolig
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {(myProperties || []).map((property: Property) => (
                  <Card key={property.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{property.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{property.address}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{property.rooms} værelser</span>
                            <span>{property.size} m²</span>
                            <span>{parseInt(property.price).toLocaleString('da-DK')} kr</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={property.available ? "secondary" : "destructive"}>
                            {property.available ? "Ledig" : "Ikke ledig"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/properties/${property.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Se
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEdit(property)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Rediger
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deletePropertyMutation.mutate(property.id)}
                          disabled={deletePropertyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Slet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProperty ? 'Rediger bolig' : 'Opret ny boliggannonce'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="F.eks. Lys 2-værelses på Nørrebro"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      {...form.register('address')}
                      placeholder="F.eks. Nørrebrogade 123"
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postnummer</Label>
                    <Input
                      id="postalCode"
                      {...form.register('postalCode')}
                      placeholder="F.eks. 2200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">By</Label>
                    <Input
                      id="city"
                      {...form.register('city')}
                      placeholder="F.eks. København N"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Månedlig leje (kr) *</Label>
                    <Input
                      id="price"
                      type="number"
                      {...form.register('price')}
                      placeholder="15000"
                    />
                    {form.formState.errors.price && (
                      <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rooms">Antal værelser *</Label>
                    <Input
                      id="rooms"
                      type="number"
                      min="1"
                      {...form.register('rooms', { valueAsNumber: true })}
                    />
                    {form.formState.errors.rooms && (
                      <p className="text-sm text-red-600">{form.formState.errors.rooms.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Størrelse (m²) *</Label>
                    <Input
                      id="size"
                      type="number"
                      min="10"
                      {...form.register('size', { valueAsNumber: true })}
                    />
                    {form.formState.errors.size && (
                      <p className="text-sm text-red-600">{form.formState.errors.size.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availableFrom">Ledig fra (valgfrit)</Label>
                    <Input
                      id="availableFrom"
                      type="date"
                      {...form.register('availableFrom')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse *</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Beskriv boligen i detaljer..."
                    rows={6}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Billeder</Label>
                  <ImageUpload
                    images={form.watch('images') || []}
                    onImagesChange={(images) => form.setValue('images', images)}
                    maxImages={10}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={Boolean(form.watch('available'))}
                    onCheckedChange={(checked) => form.setValue('available', checked as boolean)}
                  />
                  <Label htmlFor="available">Boligen er ledig</Label>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit"
                    disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
                    className="bg-danish-blue hover:bg-blue-700"
                  >
                    {editingProperty ? 'Opdater bolig' : 'Opret bolig'}
                  </Button>
                  
                  {editingProperty && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Annuller
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Beskedfunktion kommer snart</h3>
              <p className="text-gray-600">Vi arbejder på at færdiggøre beskedsystemet.</p>
              <Link href="/messages">
                <Button className="mt-4">Se beskeder</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
