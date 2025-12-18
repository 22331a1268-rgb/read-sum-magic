import { Loader2, ScanSearch, Table, Calculator, FileCheck } from 'lucide-react';

interface ProcessingOverlayProps {
  stage: 'scanning' | 'extracting' | 'validating' | 'complete';
}

const stages = {
  scanning: { icon: ScanSearch, label: 'Scanning document...' },
  extracting: { icon: Table, label: 'Extracting table data...' },
  validating: { icon: Calculator, label: 'Validating totals...' },
  complete: { icon: FileCheck, label: 'Processing complete!' },
};

export const ProcessingOverlay = ({ stage }: ProcessingOverlayProps) => {
  const { icon: Icon, label } = stages[stage];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="glass rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm mx-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          {stage !== 'complete' && (
            <div className="absolute -top-1 -right-1">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">{label}</p>
          <p className="text-sm text-muted-foreground">
            {stage === 'complete' 
              ? 'Your results are ready to view'
              : 'Please wait while we process your document'
            }
          </p>
        </div>

        {stage !== 'complete' && (
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary rounded-full shimmer" style={{ width: '60%' }} />
          </div>
        )}
      </div>
    </div>
  );
};
