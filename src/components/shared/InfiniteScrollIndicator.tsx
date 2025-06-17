import React from 'react';

interface InfiniteScrollIndicatorProps {
  loading: boolean;
  hasMore: boolean;
  total?: number;
  itemName?: string;
  className?: string;
}

const InfiniteScrollIndicator: React.FC<InfiniteScrollIndicatorProps> = ({
  loading,
  hasMore,
  total,
  itemName = 'elementos',
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-600 font-medium">
            Cargando más {itemName}...
          </span>
        </div>
      </div>
    );
  }

  if (!hasMore && total && total > 0) {
    return (
      <div className={`text-center py-6 ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-500 font-medium">
            📋 Has visto todos los {itemName} ({total} total)
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default InfiniteScrollIndicator;