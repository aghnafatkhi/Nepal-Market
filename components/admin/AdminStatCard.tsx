import React from 'react';

interface AdminStatCardProps {
  id?: string;
  title: string;
  value: number | string;
  badgeText?: string;
  badgeType?: 'danger' | 'success' | 'info' | 'neutral';
  subtext?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  id,
  title,
  value,
  badgeText,
  badgeType = 'neutral',
  subtext,
  icon,
  onClick,
  className = '',
}) => {
  const badgeStyle = {
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }[badgeType];

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      id={id}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={`w-full bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 flex items-center justify-between text-left transition-all ${
        onClick ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer' : ''
      } ${className}`}
    >
      <div className="space-y-1 min-w-0 flex-1 pr-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {badgeText && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeStyle}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 truncate">
            {subtext}
          </p>
        )}
      </div>

      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </CardWrapper>
  );
};
