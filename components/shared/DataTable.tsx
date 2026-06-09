"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  showFilter?: boolean;
}

const PAGE_SIZES = [5, 10, 20, 50];

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Buscar...",
  onSearch,
  searchValue = "",
  showFilter = true,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 bg-white"
          />
        </div>
        {showFilter && (
          <button className="btn-secondary">
            <SlidersHorizontal size={15} />
            Filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="table-header w-12">N</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="table-header"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="table-cell">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-4" />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="table-cell">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    No se encontraron resultados
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="table-cell text-gray-400 font-medium">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="table-cell">
                        {col.render
                          ? col.render(row, (page - 1) * pageSize + idx)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 bg-orange-400 text-white rounded font-medium text-xs">
            {page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-300"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span>por página</span>
        </div>
      </div>
    </div>
  );
}
