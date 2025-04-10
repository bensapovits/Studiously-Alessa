import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, ArrowRight, Check } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  columns: { key: string; name: string }[];
}

export default function ImportModal({ onClose, onImport, columns }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);

      let data: any[] = [];
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileType === 'csv') {
        data = await new Promise((resolve, reject) => {
          Papa.parse(selectedFile, {
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
          });
        });
      } else if (['xlsx', 'xls'].includes(fileType || '')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Unsupported file format');
      }

      // Filter out empty rows
      data = data.filter(row => Object.values(row).some(value => value));

      setFile(selectedFile);
      setPreview(data.slice(0, 5));
      setMappings(
        Object.keys(data[0] || {}).reduce((acc, key) => ({
          ...acc,
          [key]: columns.find(col => col.name.toLowerCase() === key.toLowerCase())?.key || ''
        }), {})
      );
      setStep('map');
    } catch (error) {
      console.error('Error parsing file:', error);
      setError('Failed to parse file. Please check the format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateData = (data: any[]) => {
    // Check if required fields are mapped
    const requiredFields = ['first_name', 'last_name'];
    const mappedFields = new Set(Object.values(mappings));
    const missingFields = requiredFields.filter(field => !mappedFields.has(field));

    if (missingFields.length > 0) {
      throw new Error(`Required fields not mapped: ${missingFields.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
      const transformedRow: any = {};
      Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
        if (targetKey) {
          transformedRow[targetKey] = row[sourceKey];
        }
      });

      // Check required fields
      if (!transformedRow.first_name?.trim()) {
        throw new Error(`Row ${index + 1}: First name is required`);
      }
      if (!transformedRow.last_name?.trim()) {
        throw new Error(`Row ${index + 1}: Last name is required`);
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      let data: any[] = [];
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'csv') {
        data = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
          });
        });
      } else if (['xlsx', 'xls'].includes(fileType || '')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      // Filter out empty rows
      data = data.filter(row => Object.values(row).some(value => value));

      // Validate data before transformation
      validateData(data);

      // Transform data based on mappings
      const transformedData = data.map(row => {
        const newRow: any = {};
        Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
          if (targetKey) {
            // Trim whitespace and ensure string values
            const value = row[sourceKey];
            newRow[targetKey] = typeof value === 'string' ? value.trim() : value;
          }
        });

        // Set default stage if not mapped
        if (!newRow.stage) {
          newRow.stage = 'New';
        }

        return newRow;
      });

      await onImport(transformedData);
      onClose();
    } catch (error) {
      console.error('Error importing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to import data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const continueToPreview = () => {
    try {
      validateData(preview);
      setStep('preview');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid data mapping');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Import Contacts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`flex-1 p-4 rounded-lg border-2 ${step === 'upload' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Upload File</span>
                {step !== 'upload' && <Check className="h-4 w-4 text-green-500 ml-2" />}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex-1 p-4 rounded-lg border-2 ${step === 'map' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Map Fields</span>
                {step === 'preview' && <Check className="h-4 w-4 text-green-500 ml-2" />}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex-1 p-4 rounded-lg border-2 ${step === 'preview' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Preview & Import</span>
              </div>
            </div>
          </div>

          {step === 'upload' && (
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV or Excel file containing your contacts
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Select File
              </button>
            </div>
          )}

          {step === 'map' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Map the columns from your file to the corresponding fields in the contacts table.
                <span className="text-red-600 font-medium"> First Name and Last Name are required.</span>
              </p>
              <div className="space-y-4">
                {Object.entries(mappings).map(([sourceKey, targetKey]) => (
                  <div key={sourceKey} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source: {sourceKey}
                      </label>
                    </div>
                    <div className="flex-1">
                      <select
                        value={targetKey}
                        onChange={(e) => setMappings({ ...mappings, [sourceKey]: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          targetKey === 'first_name' || targetKey === 'last_name'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">-- Skip Field --</option>
                        {columns.map(column => (
                          <option key={column.key} value={column.key}>
                            {column.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={continueToPreview}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Continue to Preview
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Preview the first 5 rows of your data before importing
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map(column => (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map(column => (
                          <td
                            key={column.key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {(Object.entries(mappings).find(([_, target]) => target === column.key) || [])[0] ? row[(Object.entries(mappings).find(([_, target]) => target === column.key) || [])[0]] : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}