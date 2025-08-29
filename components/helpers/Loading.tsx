'use client';

import React from 'react';
import ReactDOM from 'react-dom';

interface LoadingModalProps {
  isLoading: boolean;
}

export default function LoadingModal({ isLoading }: LoadingModalProps) {
  if (!isLoading) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-15 backdrop-blur-sm"
        aria-hidden="true"
      ></div>

      {/* Loading content */}
      <div className="relative flex flex-col items-center justify-center p-6 bg-white bg-opacity-10 rounded-xl">
        {/* Simple spinner animation */}
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-white rounded-full animate-spin"></div>
        
        {/* Optional text */}
        {/* <p className="mt-4 text-white text-lg font-medium">Loading...</p> */}
      </div>
    </div>,
    document.body
  );
}
