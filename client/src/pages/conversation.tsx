import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Message } from '@shared/schema';

export default function Conversation() {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserIdNum = parseInt(otherUserId || '0');

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages', { otherUserId: otherUserIdNum }],
    enabled: isAuthenticated && !!otherUserId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  const { data: otherUser } = useQuery({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { toUserId: number; content: string }) => {
      return apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/messages', { otherUserId: otherUserIdNum }] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved afsendelse af besked",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/conversations/${otherUserIdNum}/read`, {});
    },
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      // Mark conversation as read when viewing
      markAsReadMutation.mutate();
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      toUserId: otherUserIdNum,
      content: message.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se beskeder.</p>
            <Link href="/login">
              <Button>Log ind</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Link href="/messages">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-danish-blue rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {otherUser?.name || `Bruger ${otherUserId}`}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {otherUser?.role === 'landlord' ? 'Udlejer' : 'Lejer'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Ingen beskeder endnu. Start en samtale!</p>
                </div>
              ) : (
                messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.fromUserId === user?.id
                          ? 'bg-danish-blue text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.fromUserId === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.createdAt!).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Send Message */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Textarea
                placeholder="Skriv din besked..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[80px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-danish-blue hover:bg-blue-700 self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}