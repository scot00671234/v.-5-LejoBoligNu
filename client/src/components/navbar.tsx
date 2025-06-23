import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Home, User, Heart, MessageCircle, Plus, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="text-danish-blue h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">Lejebolig Nu</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/properties" 
                className={`transition-colors hover:text-danish-blue ${
                  location === '/properties' ? 'text-danish-blue' : 'text-gray-700'
                }`}
              >
                Boliger
              </Link>
              {isAuthenticated && user?.role === 'tenant' && (
                <Link 
                  href="/favorites" 
                  className={`transition-colors hover:text-danish-blue ${
                    location === '/favorites' ? 'text-danish-blue' : 'text-gray-700'
                  }`}
                >
                  Favoritter
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-danish-blue">
                    Log ind
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-danish-blue text-white hover:bg-blue-700">
                    Opret konto
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/messages">
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </Link>
                
                {user?.role === 'landlord' && (
                  <Link href="/dashboard/create-property">
                    <Button size="sm" className="bg-danish-blue text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Opret annonce
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-danish-blue text-white text-sm">
                          {getInitials(user?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Min profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center cursor-pointer">
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'tenant' && (
                      <DropdownMenuItem asChild>
                        <Link href="/favorites" className="flex items-center cursor-pointer">
                          <Heart className="h-4 w-4 mr-2" />
                          Favoritter
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log ud
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
