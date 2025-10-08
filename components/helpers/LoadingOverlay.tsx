export default function LoadingOverlay ({ loading }) {
  // Use opacity and visibility instead of conditional rendering for smooth transitions
  const transitionClasses = loading
    ? 'opacity-100 visible'
    : 'opacity-0 invisible pointer-events-none';

  return (
    <div
      aria-live="assertive"
      aria-busy={loading ? "true" : "false"}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
         bg-black bg-opacity-15 backdrop-blur-sm
        transition-opacity duration-300 ease-in-out
        ${transitionClasses}
      `}
    >
      <div className="flex flex-col items-center">
        <svg
          className="animate-spin h-12 w-12 text-indigo-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-4 text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};
