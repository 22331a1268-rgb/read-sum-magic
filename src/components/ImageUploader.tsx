import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageItem {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploaderProps {
  onImagesSelect: (images: ImageItem[]) => void;
  images: ImageItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const ImageUploader = ({ onImagesSelect, images, onRemove, onClear }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newImages: ImageItem[] = [];

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          file,
          preview: reader.result as string,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`
        });
        if (newImages.length === imageFiles.length) {
          onImagesSelect([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images, onImagesSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  }, [processFiles]);

  if (images.length > 0) {
    return (
      <div className="space-y-4 animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {images.length} image{images.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
          {images.map((img) => (
            <div 
              key={img.id} 
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-card group"
            >
              <img 
                src={img.preview} 
                alt="Uploaded document" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemove(img.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 hover:bg-destructive hover:border-destructive transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white truncate">{img.file.name}</p>
              </div>
            </div>
          ))}
          
          {/* Add more button */}
          <label className={cn(
            "aspect-square rounded-lg border-2 border-dashed cursor-pointer",
            "flex flex-col items-center justify-center gap-1",
            "hover:border-primary/50 hover:bg-primary/5 transition-all",
            "border-border bg-card/50"
          )}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add more</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative w-full h-64 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer",
        "flex flex-col items-center justify-center gap-4",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragging 
          ? "border-primary bg-primary/10 scale-[1.02]" 
          : "border-border bg-card/50"
      )}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
        isDragging ? "bg-primary/20" : "bg-secondary"
      )}>
        {isDragging ? (
          <ImageIcon className="w-8 h-8 text-primary animate-pulse" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-medium">
          {isDragging ? "Drop your images here" : "Drag & drop your images"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse (multiple allowed)
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Supports: JPG, PNG, WEBP • Max 10MB per image
      </p>
    </div>
  );
};
