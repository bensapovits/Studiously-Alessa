import React, { useState, useEffect, useRef } from 'react';
import { Grid, AutoSizer, ScrollSync } from 'react-virtualized';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Column<T> {
  key: keyof T;
  name: string;
  width: number;
  editable?: boolean;
  renderCell?: (value: any, row: T, isEditing: boolean, onEdit: (value: any) => void) => React.ReactNode;
  onClick?: (row: T) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onEdit?: (rowIndex: number, columnKey: keyof T, value: any) => void;
  editMode?: boolean;
}

interface EditCellState {
  rowIndex: number;
  columnKey: string;
}

interface StageOption {
  value: string;
  label: string;
  color: string;
}

const stageOptions: StageOption[] = [
  { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'Contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Meeting Booked', label: 'Meeting Booked', color: 'bg-purple-100 text-purple-800' },
  { value: 'Call Completed', label: 'Call Completed', color: 'bg-green-100 text-green-800' },
  { value: 'Follow Up', label: 'Follow Up', color: 'bg-red-100 text-red-800' }
];

export default function DataTable<T extends { id: string }>({ 
  data = [], 
  columns = [], 
  onSort, 
  onEdit,
  editMode = false
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [editingCell, setEditingCell] = useState<EditCellState | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    setEditingCell(null);
  }, [editMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingCell(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (columnKey: keyof T) => {
    if (editMode) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
    onSort?.(columnKey, direction);
  };

  const handleCellEdit = (rowIndex: number, columnKey: keyof T, value: any) => {
    onEdit?.(rowIndex, columnKey, value);
    setEditingCell(null);
    setSelectedStage(null);
  };

  const handleCellClick = (column: Column<T>, row: T, rowIndex: number) => {
    if (editMode && column.editable) {
      setEditingCell({ rowIndex, columnKey: column.key as string });
      if (column.key === 'stage') {
        setSelectedStage(row[column.key] as string);
      }
    } else if (column.onClick) {
      column.onClick(row);
    }
  };

  const getColumnWidth = ({ index }: { index: number }) => {
    return columns[index].width;
  };

  const renderHeaderCell = ({ columnIndex, key, style }) => {
    const column = columns[columnIndex];
    const isSorted = sortConfig?.key === column.key;

    return (
      <div
        key={key}
        style={{ ...style }}
        className={`flex items-center px-4 py-2 select-none group border-b border-r ${
          editMode 
            ? 'bg-blue-50/50 border-gray-300' 
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <button
          onClick={() => handleSort(column.key)}
          className={`flex items-center space-x-2 font-medium ${
            editMode ? 'text-gray-500 cursor-default' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="truncate">{column.name}</span>
          {isSorted && !editMode && (
            sortConfig?.direction === 'asc' ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  const renderCell = ({ columnIndex, key, rowIndex, style }) => {
    const column = columns[columnIndex];
    const row = data[rowIndex];
    const value = row[column.key];
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;

    if (editMode && column.editable && isEditing) {
      if (column.key === 'stage') {
        return (
          <div 
            ref={dropdownRef}
            key={key} 
            style={style}
            className="relative px-4 py-2 bg-white border-b border-r border-gray-300"
          >
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
              <div className="space-y-1">
                {stageOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleCellEdit(rowIndex, column.key, option.value)}
                    className={`w-full flex items-center px-3 py-2 rounded-md hover:bg-gray-50 ${
                      selectedStage === option.value ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              {value && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stageOptions.find(opt => opt.value === value)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {value}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        );
      }

      return (
        <div 
          key={key} 
          style={style}
          className="relative px-4 py-2 bg-white border-b border-r border-gray-300"
        >
          <input
            ref={editInputRef}
            type="text"
            defaultValue={value || ''}
            onBlur={(e) => handleCellEdit(rowIndex, column.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellEdit(rowIndex, column.key, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className="absolute inset-0 w-full h-full px-4 py-2 bg-white border-2 border-blue-500 outline-none shadow-sm"
          />
        </div>
      );
    }

    if (column.renderCell) {
      return (
        <div
          key={key}
          style={style}
          className={`relative px-4 py-2 truncate group transition-colors ${
            editMode 
              ? 'bg-white border-gray-300' 
              : 'bg-white border-gray-200'
          } border-b border-r cursor-pointer`}
          onClick={() => handleCellClick(column, row, rowIndex)}
        >
          {column.renderCell(value, row, isEditing, (newValue) => handleCellEdit(rowIndex, column.key, newValue))}
        </div>
      );
    }

    if (column.key === 'stage') {
      const option = stageOptions.find(opt => opt.value === value);
      return (
        <div
          key={key}
          style={style}
          className={`relative px-4 py-2 truncate group transition-colors ${
            editMode 
              ? 'bg-white border-gray-300 cursor-text hover:bg-blue-50/50' 
              : 'bg-white border-gray-200 hover:bg-gray-50'
          } border-b border-r`}
          onClick={() => handleCellClick(column, row, rowIndex)}
        >
          {option && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
              {option.label}
            </span>
          )}
        </div>
      );
    }

    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div
              key={key}
              style={style}
              className={`relative px-4 py-2 truncate group transition-colors ${
                editMode && column.editable
                  ? 'bg-white border-gray-300 cursor-text hover:bg-blue-50/50'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } border-b border-r`}
              onClick={() => handleCellClick(column, row, rowIndex)}
            >
              <span className="truncate block">{value || ''}</span>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg"
              sideOffset={5}
            >
              {value || ''}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  };

  return (
    <div className="h-full bg-white">
      <AutoSizer>
        {({ width, height }) => (
          <ScrollSync>
            {({ onScroll, scrollLeft }) => (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div style={{ height: 40 }} className="flex-none">
                  <Grid
                    className="Grid"
                    columnCount={columns.length}
                    columnWidth={getColumnWidth}
                    height={40}
                    rowCount={1}
                    rowHeight={() => 40}
                    width={width}
                    scrollLeft={scrollLeft}
                    cellRenderer={renderHeaderCell}
                    style={{ overflow: 'hidden' }}
                  />
                </div>
                
                {/* Body */}
                <div className="flex-1">
                  <Grid
                    className="Grid"
                    columnCount={columns.length}
                    columnWidth={getColumnWidth}
                    height={height - 40}
                    rowCount={data.length}
                    rowHeight={() => 40}
                    width={width}
                    onScroll={onScroll}
                    cellRenderer={renderCell}
                  />
                </div>
              </div>
            )}
          </ScrollSync>
        )}
      </AutoSizer>
    </div>
  );
}