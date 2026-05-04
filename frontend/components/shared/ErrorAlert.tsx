import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', onRetry }: ErrorAlertProps) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">حدث خطأ</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
