import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLoadingProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

export const AdminLoading: React.FC<AdminLoadingProps> = ({
  message = 'Memuat Data Admin...',
  submessage = 'Mohon tunggu sebentar selagi sistem sinkronisasi data.',
  fullscreen = false,
}) => {
  const content = (
    <div className="text-center space-y-3 max-w-sm mx-auto p-6">
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
      <h2 className="text-sm sm:text-base font-bold text-slate-800">
        {message}
      </h2>
      {submessage && (
        <p className="text-xs text-slate-500 leading-relaxed">
          {submessage}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-12 flex items-center justify-center">
      {content}
    </div>
  );
};
