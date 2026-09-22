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
      className={`w-full overflow-x-auto border border-slate-200 rounded-lg bg-white ${className}`}
    >
      <table className="w-full text-left text-xs border-collapse">
        <thead>
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
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className="hover:bg-slate-50/70 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={`td-${colIdx}`}
                  className={`py-3 px-3 sm:px-4 ${col.className || ''}`}
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
