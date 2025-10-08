'use client';

import { cacheData } from '@/lib/server_actions/redis';
import { useState } from 'react';

// --- Main Client Component ---

export default function RedisDemoPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // This function wraps the Server Action call
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('Processing...');

    // Call the server action with the form data
    const formData = new FormData(event.currentTarget);
    const result = await cacheData(formData);

    if (result.success) {
      setStatus(`✅ Success: ${result.message}`);
    } else {
      setStatus(`❌ Error: ${result.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
          Next.js 14 + Redis Cache Demo
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          This form calls a **Server Action** to SET and GET a value in your Redis instance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700">
              Cache Key
            </label>
            <input
              type="text"
              id="key"
              name="key"
              defaultValue="user:session:123"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="e.g., user:data:42"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Cache Value
            </label>
            <input
              type="text"
              id="value"
              name="value"
              defaultValue="Hello from NextJS!"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="e.g., serialized JSON data"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-150"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Run Server Action (Cache Data)'
            )}
          </button>
        </form>

        {status && (
          <div className={`mt-6 p-3 rounded-lg text-sm font-mono ${status.startsWith('❌') ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-red-300'}`}>
            {status}
          </div>
        )}

      </div>
    </div>
  );
}