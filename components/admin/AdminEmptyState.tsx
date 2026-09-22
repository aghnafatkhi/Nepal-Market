import React from 'react';

interface AdminEmptyStateProps {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  id,
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};
