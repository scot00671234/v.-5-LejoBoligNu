import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin } from 'lucide-react';

interface SearchFormProps {
  onSearch: (filters: {
    location?: string;
    rooms?: number;
    maxPrice?: number;
  }) => void;
  className?: string;
}

export default function SearchForm({ onSearch, className = "" }: SearchFormProps) {
  const [location, setLocation] = useState('');
  const [rooms, setRooms] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: any = {};
    if (location.trim()) filters.location = location.trim();
    if (rooms && rooms !== 'all') filters.rooms = parseInt(rooms);
    if (maxPrice && maxPrice !== 'unlimited') filters.maxPrice = parseInt(maxPrice);
    
    onSearch(filters);
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-2xl ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Hvor?
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                type="text"
                placeholder="By, område eller postnummer"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-2">
              Værelser
            </Label>
            <Select value={rooms} onValueChange={setRooms}>
              <SelectTrigger>
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="1">1 værelse</SelectItem>
                <SelectItem value="2">2 værelser</SelectItem>
                <SelectItem value="3">3 værelser</SelectItem>
                <SelectItem value="4">4+ værelser</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Max pris
            </Label>
            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger>
                <SelectValue placeholder="Ingen grænse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Ingen grænse</SelectItem>
                <SelectItem value="10000">10.000 kr</SelectItem>
                <SelectItem value="15000">15.000 kr</SelectItem>
                <SelectItem value="20000">20.000 kr</SelectItem>
                <SelectItem value="25000">25.000 kr</SelectItem>
                <SelectItem value="30000">30.000+ kr</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              type="submit"
              className="w-full bg-danish-blue text-white hover:bg-blue-700 font-medium"
            >
              <Search className="h-4 w-4 mr-2" />
              Søg boliger
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
