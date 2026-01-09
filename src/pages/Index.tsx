import { useState, useRef } from 'react';
import { FileText, Sparkles, Download, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader, ImageItem } from '@/components/ImageUploader';
import { ExtractedData } from '@/components/ExtractedData';
import { ResultCanvas, ResultCanvasRef } from '@/components/ResultCanvas';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TableRow {
  qNo: string;
  a: string;
  b: string;
  c: string;
  total: string;
}

interface ExtractionResult {
  headerInfo: Record<string, string>;
  tableData: TableRow[];
  totalMarks: {
    calculated: number;
    written: number;
    bubbleDigits: number;
  };
  isValid: boolean;
  imageId: string;
  imageName: string;
}

const Index = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'scanning' | 'extracting' | 'validating' | 'complete'>('scanning');
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const resultCanvasRef = useRef<ResultCanvasRef>(null);
  const { toast } = useToast();

  const handleImagesSelect = (newImages: ImageItem[]) => {
    setImages(newImages);
    setResults([]);
    setCurrentResultIndex(0);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleClear = () => {
    setImages([]);
    setResults([]);
    setCurrentResultIndex(0);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (image: ImageItem): Promise<ExtractionResult | null> => {
    try {
      const imageBase64 = await fileToBase64(image.file);
      
      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract document');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const tableData = (data.tableData || []).map((row: any) => ({
        qNo: String(row.qNo || ''),
        a: String(row.a || ''),
        b: String(row.b || ''),
        c: String(row.c || ''),
        total: String(row.total || ''),
      }));

      const calculatedSum = tableData.reduce((sum: number, row: TableRow) => {
        const total = parseInt(row.total) || 0;
        return sum + total;
      }, 0);

      const writtenTotal = parseInt(data.writtenTotal) || 0;
      const bubbleDigits = parseInt(data.bubbleDigits) || 0;
      const isValid = calculatedSum === bubbleDigits;

      return {
        headerInfo: data.headerInfo || {},
        tableData,
        totalMarks: {
          calculated: calculatedSum,
          written: writtenTotal,
          bubbleDigits: bubbleDigits,
        },
        isValid,
        imageId: image.id,
        imageName: image.file.name,
      };
    } catch (error) {
      console.error(`Error processing ${image.file.name}:`, error);
      return null;
    }
  };

  const handleExtract = async () => {
    if (images.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please upload at least one image',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStage('scanning');
    setProcessingProgress({ current: 0, total: images.length });
    setResults([]);

    const extractedResults: ExtractionResult[] = [];
    let failedCount = 0;

    for (let i = 0; i < images.length; i++) {
      setProcessingProgress({ current: i + 1, total: images.length });
      setProcessingStage(i === 0 ? 'scanning' : 'extracting');

      const result = await processImage(images[i]);
      if (result) {
        extractedResults.push(result);
      } else {
        failedCount++;
      }
    }

    setProcessingStage('validating');
    await new Promise(r => setTimeout(r, 300));
    setProcessingStage('complete');
    await new Promise(r => setTimeout(r, 200));

    setResults(extractedResults);
    setCurrentResultIndex(0);
    setIsProcessing(false);

    const validCount = extractedResults.filter(r => r.isValid).length;
    
    if (extractedResults.length === 0) {
      toast({
        title: 'Extraction Failed',
        description: 'Failed to process any images. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Processed ${extractedResults.length} of ${images.length} images`,
        description: `${validCount} passed validation${failedCount > 0 ? `, ${failedCount} failed to process` : ''}`,
        variant: validCount === extractedResults.length ? 'default' : 'destructive',
      });
    }
  };

  const handleDownload = () => {
    resultCanvasRef.current?.downloadImage();
    toast({
      title: 'Download Started',
      description: 'Your result image is being downloaded.',
    });
  };

  const handleDownloadAll = async () => {
    toast({
      title: 'Downloading all results',
      description: `Preparing ${results.length} images...`,
    });
    
    // Download each result with a small delay
    for (let i = 0; i < results.length; i++) {
      setCurrentResultIndex(i);
      await new Promise(r => setTimeout(r, 300)); // Wait for canvas to render
      resultCanvasRef.current?.downloadImage(results[i].imageName);
    }
  };

  const currentResult = results[currentResultIndex];

  return (
    <div className="min-h-screen bg-background">
      {isProcessing && (
        <ProcessingOverlay 
          stage={processingStage} 
          progress={processingProgress}
        />
      )}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(175_80%_45%/0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">AI-Powered OCR</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Document</span>{' '}
              <span className="text-foreground">Extractor</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Extract handwritten text, tables, and validate totals from exam sheets 
              and documents with intelligent OCR technology.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column - Upload & Image */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>
                    <p className="text-sm text-muted-foreground">Upload one or multiple images</p>
                  </div>
                </div>

                <ImageUploader 
                  onImagesSelect={handleImagesSelect}
                  images={images}
                  onRemove={handleRemoveImage}
                  onClear={handleClear}
                />

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="glow" 
                    size="lg" 
                    className="flex-1"
                    onClick={handleExtract}
                    disabled={images.length === 0 || isProcessing}
                  >
                    <Sparkles className="w-4 h-4" />
                    Extract {images.length > 1 ? `All (${images.length})` : 'Data'}
                  </Button>
                  {results.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={handleClear}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {results.length > 0 && currentResult ? (
                <>
                  {/* Navigation for multiple results */}
                  {results.length > 1 && (
                    <div className="glass rounded-xl p-4 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentResultIndex(i => Math.max(0, i - 1))}
                        disabled={currentResultIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        {results.map((r, idx) => (
                          <button
                            key={r.imageId}
                            onClick={() => setCurrentResultIndex(idx)}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all",
                              idx === currentResultIndex 
                                ? "bg-primary scale-125" 
                                : r.isValid 
                                  ? "bg-success/50 hover:bg-success" 
                                  : "bg-destructive/50 hover:bg-destructive"
                            )}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentResultIndex(i => Math.min(results.length - 1, i + 1))}
                        disabled={currentResultIndex === results.length - 1}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground text-center">
                    <span className="font-medium text-foreground">{currentResult.imageName}</span>
                    {results.length > 1 && (
                      <span> • {currentResultIndex + 1} of {results.length}</span>
                    )}
                  </div>

                  <ExtractedData {...currentResult} />
                  
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Result Image</h3>
                      <div className="flex gap-2">
                        {results.length > 1 && (
                          <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                            <Download className="w-4 h-4" />
                            All ({results.length})
                          </Button>
                        )}
                        <Button variant="default" size="sm" onClick={handleDownload}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ResultCanvas 
                      ref={resultCanvasRef}
                      {...currentResult}
                    />
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    Upload document images and click "Extract Data" to see the extracted information here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;