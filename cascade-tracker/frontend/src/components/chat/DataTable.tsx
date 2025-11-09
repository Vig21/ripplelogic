'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import { TableData } from '@/utils/messageParser';

interface DataTableProps {
  data: TableData;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copied, setCopied] = useState(false);

  const sortedRows = useMemo(() => {
    if (sortColumn === null || sortDirection === null) {
      return data.rows;
    }

    return [...data.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data.rows, sortColumn, sortDirection]);

  const handleSort = (columnIndex: number) => {
    if (!data.sortable) return;

    if (sortColumn === columnIndex) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const handleCopyTable = async () => {
    // Create tab-separated values
    const tsvContent = [
      data.headers.join('\t'),
      ...data.rows.map(row => row.join('\t')),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy table:', err);
    }
  };

  const getCellAlignment = (value: string | number): string => {
    if (typeof value === 'number') return 'text-right';

    // Check if string represents a number
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      return 'text-right';
    }

    return 'text-left';
  };

  const formatCellValue = (value: string | number): string => {
    if (typeof value === 'number') {
      // Format numbers with commas
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5"
    >
      {/* Copy Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopyTable}
          className="
            flex items-center gap-1.5 px-2 py-1 rounded-md
            bg-white/10 hover:bg-white/20
            text-white/70 hover:text-white
            text-xs font-medium
            transition-all duration-200
          "
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider
                    ${data.sortable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{header}</span>
                    {data.sortable && sortColumn === index && (
                      <span className="text-pm-teal">
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rowIndex * 0.05, duration: 0.2 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`
                      px-4 py-3 text-sm text-white/80
                      ${getCellAlignment(cell)}
                    `}
                  >
                    {formatCellValue(cell)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-white/5 border-t border-white/10">
        <div className="text-xs text-white/50">
          {sortedRows.length} {sortedRows.length === 1 ? 'row' : 'rows'}
          {data.sortable && ' • Click headers to sort'}
        </div>
      </div>
    </motion.div>
  );
}
