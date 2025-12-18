import { useState, useRef } from 'react';
import { FileText, Sparkles, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ImageUploader';
import { ExtractedData } from '@/components/ExtractedData';
import { ResultCanvas, ResultCanvasRef } from '@/components/ResultCanvas';
import { ProcessingOverlay } from '@/components/ProcessingOverlay';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

const Index = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'scanning' | 'extracting' | 'validating' | 'complete'>('scanning');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const resultCanvasRef = useRef<ResultCanvasRef>(null);
  const { toast } = useToast();

  const handleImageSelect = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setResult(null);
  };

  const handleClear = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  const handleExtract = async () => {
    if (!imageFile) {
      toast({
        title: 'No image selected',
        description: 'Please upload an image first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStage('scanning');

    try {
      // Convert image to base64
      const imageBase64 = await fileToBase64(imageFile);
      
      setProcessingStage('extracting');
      
      // Call the edge function for real OCR
      const { data, error } = await supabase.functions.invoke('extract-document', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract document');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setProcessingStage('validating');
      
      // Normalize table data
      const tableData = (data.tableData || []).map((row: any) => ({
        qNo: String(row.qNo || ''),
        a: String(row.a || ''),
        b: String(row.b || ''),
        c: String(row.c || ''),
        total: String(row.total || ''),
      }));

      // Calculate sum from table
      const calculatedSum = tableData.reduce((sum: number, row: TableRow) => {
        const total = parseInt(row.total) || 0;
        return sum + total;
      }, 0);

      const writtenTotal = parseInt(data.writtenTotal) || 0;
      const bubbleDigits = parseInt(data.bubbleDigits) || 0;

      await new Promise(r => setTimeout(r, 500));
      setProcessingStage('complete');
      
      await new Promise(r => setTimeout(r, 300));

      const isValid = calculatedSum === bubbleDigits;

      setResult({
        headerInfo: data.headerInfo || {},
        tableData,
        totalMarks: {
          calculated: calculatedSum,
          written: writtenTotal,
          bubbleDigits: bubbleDigits,
        },
        isValid,
      });

      toast({
        title: isValid ? 'Extraction Complete' : 'Validation Warning',
        description: isValid 
          ? 'Document processed successfully. All totals match!'
          : 'Document processed but totals do not match. Please review.',
        variant: isValid ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Failed to process the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    resultCanvasRef.current?.downloadImage();
    toast({
      title: 'Download Started',
      description: 'Your result image is being downloaded.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {isProcessing && <ProcessingOverlay stage={processingStage} />}
      
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
                    <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
                    <p className="text-sm text-muted-foreground">Upload an image to extract data</p>
                  </div>
                </div>

                <ImageUploader 
                  onImageSelect={handleImageSelect}
                  preview={imagePreview}
                  onClear={handleClear}
                />

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="glow" 
                    size="lg" 
                    className="flex-1"
                    onClick={handleExtract}
                    disabled={!imageFile || isProcessing}
                  >
                    <Sparkles className="w-4 h-4" />
                    Extract Data
                  </Button>
                  {result && (
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
              {result ? (
                <>
                  <ExtractedData {...result} />
                  
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Result Image</h3>
                      <Button variant="default" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                    <ResultCanvas 
                      ref={resultCanvasRef}
                      {...result}
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
                    Upload a document image and click "Extract Data" to see the extracted information here.
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
