import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "For mange billeder",
        description: `Du kan maksimalt uploade ${maxImages} billeder`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const newImages: string[] = [];
      
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Ugyldig filtype",
            description: "Kun billedfiler er tilladt",
            variant: "destructive",
          });
          continue;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Fil for stor",
            description: "Billeder må maksimalt være 5MB",
            variant: "destructive",
          });
          continue;
        }

        // Convert to base64 for now (in production, upload to cloud storage)
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }
      
      onImagesChange([...images, ...newImages]);
      
      if (newImages.length > 0) {
        toast({
          title: "Billeder uploadet",
          description: `${newImages.length} billede(r) blev uploadet`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload fejl",
        description: "Der opstod en fejl ved upload af billeder",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-2">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {images.length < maxImages && (
          <Card 
            className="border-dashed border-2 hover:border-danish-blue cursor-pointer transition-colors"
            onClick={openFileDialog}
          >
            <CardContent className="p-2">
              <div className="aspect-square flex flex-col items-center justify-center text-gray-400 hover:text-danish-blue transition-colors">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-danish-blue"></div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm text-center">Upload billede</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Ingen billeder uploadet endnu</p>
          <Button 
            variant="outline" 
            onClick={openFileDialog}
            className="mt-2"
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload billeder
          </Button>
        </div>
      )}
      
      <p className="text-sm text-gray-500 mt-2">
        {images.length}/{maxImages} billeder. Maksimal filstørrelse: 5MB
      </p>
    </div>
  );
}