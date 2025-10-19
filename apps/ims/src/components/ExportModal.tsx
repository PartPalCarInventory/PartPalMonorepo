import { FC, useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  reportType: string;
}

export const ExportModal: FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  reportType,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [emailReport, setEmailReport] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleExport = () => {
    onExport(selectedFormat);
    onClose();
  };

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Formatted report with charts and styling',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Spreadsheet format with multiple sheets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14M16 5v14" />
        </svg>
      ),
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Raw data in comma-separated format',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="space-y-3">
                {exportFormats.map((format) => (
                  <label
                    key={format.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`flex-shrink-0 ${
                      selectedFormat === format.id ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {format.icon}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium ${
                        selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {format.name}
                      </div>
                      <div className="text-xs text-gray-500">{format.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={selectedFormat === 'csv'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Include charts and visualizations</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include raw data tables</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailReport}
                    onChange={(e) => setEmailReport(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email report when ready</span>
                </label>
              </div>
            </div>

            {/* Email Address */}
            {emailReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* File Size Estimate */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-600">
                  Estimated file size: {
                    selectedFormat === 'pdf' ? '2-5 MB' :
                    selectedFormat === 'excel' ? '1-3 MB' :
                    '50-200 KB'
                  }
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Processing time: {
                  selectedFormat === 'pdf' ? '30-60 seconds' :
                  selectedFormat === 'excel' ? '15-30 seconds' :
                  '5-10 seconds'
                }
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={emailReport && !emailAddress}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};