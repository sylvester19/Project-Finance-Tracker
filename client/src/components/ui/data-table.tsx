import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface Column<T> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading: boolean;
  onRowClick?: (row: T) => void;
  keyField: string;
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  onRowClick,
  keyField,
  emptyMessage = 'No data found',
  pageSize = 10
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const isMobile = useMobile();
  
  const visibleColumns = isMobile
    ? columns.filter(column => !column.hideOnMobile)
    : columns;

  // Get data for current page
  const getCurrentPageData = () => {
    if (!data) return [];
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  };

  const currentData = getCurrentPageData();
  const totalPages = data ? Math.ceil(data.length / pageSize) : 0;

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column, index) => (
                <th 
                  key={index} 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {visibleColumns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {colIndex === 0 ? (
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24 mt-1" />
                          </div>
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-20" />
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : currentData.length > 0 ? (
              currentData.map((row, rowIndex) => (
                <tr 
                  key={row[keyField]} 
                  className={`${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {visibleColumns.map((column, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap">
                      {column.cell ? column.cell(row) : row[column.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={visibleColumns.length} 
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.length > pageSize && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <nav className="flex items-center justify-between" aria-label="Pagination">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentData.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, data.length)}
                </span>{' '}
                of <span className="font-medium">{data.length}</span> results
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-3"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
