import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T> {
  id?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyState?: React.ReactNode;
  className?: string;
}

export function AdminTable<T>({
  id,
  columns,
  data,
  keyExtractor,
  emptyState,
  className = '',
}: AdminTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      id={id}
      className={`w-full border border-slate-200 rounded-lg bg-white overflow-hidden ${className}`}
    >
      <table className="block w-full text-left text-xs sm:table">
        <thead className="hidden sm:table-header-group">
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th
                key={`th-${idx}`}
                className={`py-2.5 px-3 sm:px-4 font-semibold text-slate-600 ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block divide-y divide-slate-200 text-slate-700 sm:table-row-group sm:divide-y sm:divide-slate-100">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className="block p-3 hover:bg-slate-50/70 sm:table-row sm:p-0"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={`td-${colIdx}`}
                  data-label={col.header}
                  className={`flex min-w-0 items-center justify-between gap-4 px-0 py-2 before:shrink-0 before:text-[10px] before:font-semibold before:uppercase before:tracking-wide before:text-slate-400 before:content-[attr(data-label)] sm:table-cell sm:px-4 sm:py-3 sm:before:hidden ${col.className || ''}`}
                >
                  {col.render
                    ? col.render(item, index)
                    : col.accessor
                    ? String(item[col.accessor] ?? '')
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
