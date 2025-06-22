import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Mail } from 'lucide-react';
import { Link } from 'wouter';
import type { Message } from '@shared/schema';

export default function Messages() {
  const { user, isAuthenticated } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se dine beskeder.</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mine beskeder</h1>
        <p className="text-gray-600">Se og administrer dine beskeder</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : messages?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen beskeder endnu</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'tenant' 
                ? 'Når du kontakter udlejere, vil dine beskeder vises her.'
                : 'Når lejere kontakter dig, vil beskederne vises her.'
              }
            </p>
            <Link href="/properties">
              <Button className="bg-danish-blue hover:bg-blue-700">
                {user?.role === 'tenant' ? 'Find boliger' : 'Se dine boliger'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages?.map((message: Message) => (
            <Card key={message.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {message.fromUserId === user?.id ? 'Til: ' : 'Fra: '}
                    Bruger {message.fromUserId === user?.id ? message.toUserId : message.fromUserId}
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {new Date(message.createdAt!).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{message.content}</p>
                {message.propertyId && (
                  <Link href={`/properties/${message.propertyId}`} className="inline-block mt-3">
                    <Button variant="outline" size="sm">
                      Se bolig
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
