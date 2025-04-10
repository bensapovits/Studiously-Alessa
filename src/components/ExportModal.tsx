import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, File as FilePdf } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExportModalProps {
  onClose: () => void;
  data: any[];
  columns: { key: string; name: string }[];
  filters?: any;
}

export default function ExportModal({ onClose, data, columns, filters }: ExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(columns.map(c => c.key)));
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  const toggleColumn = (key: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedColumns(newSelected);
  };

  const handleExport = () => {
    const selectedData = data.map(row => {
      const newRow: any = {};
      columns.forEach(column => {
        if (selectedColumns.has(column.key)) {
          newRow[column.name] = row[column.key];
        }
      });
      return newRow;
    });

    switch (format) {
      case 'csv':
        exportCSV(selectedData);
        break;
      case 'excel':
        exportExcel(selectedData);
        break;
      case 'pdf':
        exportPDF(selectedData);
        break;
    }

    onClose();
  };

  const exportCSV = (data: any[]) => {
    const headers = columns
      .filter(col => selectedColumns.has(col.key))
      .map(col => col.name);
    
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'contacts.csv';
    link.click();
  };

  const exportExcel = (data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    XLSX.writeFile(workbook, 'contacts.xlsx');
  };

  const exportPDF = (data: any[]) => {
    const doc = new jsPDF();
    const headers = columns
      .filter(col => selectedColumns.has(col.key))
      .map(col => col.name);
    
    const rows = data.map(row => 
      headers.map(header => row[header] || '')
    );

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      margin: { top: 20 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [26, 86, 219] }
    });

    doc.save('contacts.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Export Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Export Format</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setFormat('csv')}
                className={`p-4 border rounded-lg text-center ${
                  format === 'csv' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm font-medium">CSV</span>
              </button>
              <button
                onClick={() => setFormat('excel')}
                className={`p-4 border rounded-lg text-center ${
                  format === 'excel' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <span className="text-sm font-medium">Excel</span>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 border rounded-lg text-center ${
                  format === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <FilePdf className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <span className="text-sm font-medium">PDF</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Select Columns</h3>
            <div className="grid grid-cols-3 gap-4">
              {columns.map(column => (
                <label
                  key={column.key}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{column.name}</span>
                </label>
              ))}
            </div>
          </div>

          {filters && Object.keys(filters).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  The exported data will include only the filtered results.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedColumns.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}