import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  preview: string | null;
  onClear: () => void;
}

export const ImageUploader = ({ onImageSelect, preview, onClear }: ImageUploaderProps) => {
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          onImageSelect(file, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  if (preview) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border bg-card animate-scale-in">
        <img 
          src={preview} 
          alt="Uploaded document" 
          className="w-full h-auto max-h-[400px] object-contain"
        />
        <button
          onClick={onClear}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive hover:border-destructive transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
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
          {isDragging ? "Drop your image here" : "Drag & drop your image"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse
        </p>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Supports: JPG, PNG, WEBP
      </p>
    </div>
  );
};
