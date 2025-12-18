import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableRow {
  qNo: string;
  a: string;
  b: string;
  c: string;
  total: string;
}

interface ExtractedDataProps {
  headerInfo: Record<string, string>;
  tableData: TableRow[];
  totalMarks: {
    calculated: number;
    written: number;
    bubbleDigits: number;
  };
  isValid: boolean;
}

export const ExtractedData = ({ headerInfo, tableData, totalMarks, isValid }: ExtractedDataProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider">
          Document Information
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(headerInfo).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
              <p className="text-sm font-medium text-foreground">{value || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table Data */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
            Marks Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Q.No</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">A</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">B</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">C</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{row.qNo}</td>
                  <td className="px-4 py-3 text-sm font-mono text-center text-foreground">{row.a || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-center text-foreground">{row.b || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-center text-foreground">{row.c || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-right font-semibold text-primary">{row.total || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Summary */}
      <div className={cn(
        "rounded-xl p-5 border-2 transition-all",
        isValid 
          ? "bg-success/10 border-success/30" 
          : "bg-destructive/10 border-destructive/30"
      )}>
        <div className="flex items-center gap-3 mb-4">
          {isValid ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-destructive" />
          )}
          <h3 className={cn(
            "text-lg font-semibold",
            isValid ? "text-success" : "text-destructive"
          )}>
            {isValid ? "Validation Passed" : "Validation Failed"}
          </h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Calculated Sum</p>
            <p className="text-2xl font-bold font-mono text-foreground">{totalMarks.calculated}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Written Total</p>
            <p className="text-2xl font-bold font-mono text-foreground">{totalMarks.written}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Bubble Digits</p>
            <p className="text-2xl font-bold font-mono text-foreground">{totalMarks.bubbleDigits}</p>
          </div>
        </div>

        {!isValid && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-background/50">
            <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              The calculated sum does not match the bubble digits. Please verify the marks manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
