import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Save, User } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'wouter';

const profileFormSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Biografi må maksimalt være 500 tegn').optional(),
  profilePictureUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      phone: '',
      bio: '',
      profilePictureUrl: '',
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: isAuthenticated,
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile && !isLoading) {
      const userData = (profile as any)?.user || profile;
      if (userData) {
        form.reset({
          name: userData.name || '',
          bio: userData.bio || '',
          profilePictureUrl: userData.profilePictureUrl || '',
          phone: userData.phone || '',
        });
      }
    }
  }, [profile, isLoading, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest('PUT', '/api/auth/profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Profil opdateret",
        description: "Din profil er blevet opdateret.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved opdatering af profil.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ugyldig filtype",
        description: "Kun billedfiler er tilladt",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fil for stor",
        description: "Profilbilleder må maksimalt være 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      form.setValue('profilePictureUrl', base64);
      toast({
        title: "Billede uploadet",
        description: "Dit profilbillede er blevet uploadet",
      });
    } catch (error) {
      toast({
        title: "Upload fejl",
        description: "Der opstod en fejl ved upload af billede",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se din profil.</p>
            <Link href="/login">
              <Button>Log ind</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Min profil</h1>
          <p className="text-gray-600">Administrer dine personlige oplysninger</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profiloplysninger</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      {form.watch('profilePictureUrl') ? (
                        <AvatarImage 
                          src={form.watch('profilePictureUrl')} 
                          alt={form.watch('name')}
                        />
                      ) : (
                        <AvatarFallback className="bg-danish-blue text-white text-xl">
                          {getInitials(form.watch('name') || user?.name || '')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image"
                    />
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 bg-danish-blue text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Fulde navn *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Dit fulde navn"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer (valgfrit)</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="f.eks. +45 12 34 56 78"
                      type="tel"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografi (valgfrit)</Label>
                    <Textarea
                      id="bio"
                      {...form.register('bio')}
                      placeholder="Fortæl lidt om dig selv..."
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      {form.formState.errors.bio && (
                        <p className="text-sm text-red-600">{form.formState.errors.bio.message}</p>
                      )}
                      <p className="text-sm text-gray-500 ml-auto">
                        {(form.watch('bio') || '').length}/500 tegn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending || uploading}
                    className="bg-danish-blue hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Gemmer...' : 'Gem ændringer'}
                  </Button>
                  
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Tilbage til dashboard
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}