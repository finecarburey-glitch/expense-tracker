import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading-spinner w-16 h-16 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
        <p className="text-gray-500">Please wait while we set up your expense tracker</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
