'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key?: keyof T | string;
  label?: string;
  header?: string;
  render?: ((value: T[keyof T], item: T) => React.ReactNode) | ((item: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  // Optional controlled pagination from server
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  pageSize = 10,
  className,
  emptyMessage = 'Aucune donnée trouvée',
  pagination,
  currentPage: currentPageProp,
  onPageChange,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageState, setCurrentPageState] = useState(1);
  const currentPage = currentPageProp ?? currentPageState;
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtrage des données
  const filteredData = data.filter((item) =>
    searchable && searchTerm
      ? columns.some((column) => {
          if (!column.key) return false;
          const key = column.key as keyof T;
          const value = (item as any)[key];
          return value !== undefined && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      : true
  );

  // Tri des données
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;

  const aValue = (a as any)[sortColumn as any];
  const bValue = (b as any)[sortColumn as any];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : Math.max(1, Math.ceil(sortedData.length / pageSize));

  const paginatedData = pagination
    ? sortedData // assume data already paginated by server
    : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (columnKey: keyof T) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) onPageChange(page);
    else setCurrentPageState(page);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barre de recherche */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handlePageChange(1);
            }}
            className="pl-10"
          />
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-50',
                    column.className
                  )}
                  onClick={() => column.sortable && column.key && handleSort(column.key as keyof T)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label ?? column.header ?? ''}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className={column.className}>
                      {column.render
                        ? (column.render as any)((column.key ? (item as any)[column.key as any] : undefined), item)
                        : column.key
                          ? String(((item as any)[column.key as keyof T]) ?? '')
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {pagination ? (
              <>
                Affichage de {Math.min((currentPage - 1) * (pagination.limit || pageSize) + 1, pagination.total)} à{' '}
                {Math.min(currentPage * (pagination.limit || pageSize), pagination.total)} sur {pagination.total} résultats
              </>
            ) : (
              <>
                Affichage de {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} à{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} sur {sortedData.length} résultats
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNumber > totalPages) return null;

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
