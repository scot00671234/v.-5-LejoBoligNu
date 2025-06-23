import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Mail, User } from 'lucide-react';
import { Link } from 'wouter';

interface Conversation {
  otherUserId: number;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  propertyId?: number;
  propertyTitle?: string;
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 10000, // Refresh every 10 seconds
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
      ) : !conversations || conversations.length === 0 ? (
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
          {conversations.map((conversation) => (
            <Link key={conversation.otherUserId} href={`/messages/${conversation.otherUserId}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-danish-blue rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.otherUserName}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm truncate mb-1">
                          {conversation.lastMessage}
                        </p>
                        {conversation.propertyTitle && (
                          <p className="text-danish-blue text-xs truncate">
                            Vedrørende: {conversation.propertyTitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {new Date(conversation.lastMessageTime).toLocaleDateString('da-DK', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
