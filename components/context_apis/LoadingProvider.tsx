'use client';
import { Dispatch, SetStateAction, createContext, useState, useContext } from 'react';

// Define the type for the context value
interface LoadingContextType {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>
  };
  
// 1. Create the context
const LoadingContext = createContext<LoadingContextType>(null!);

// 2. Create a provider component
export function LoadingProvider({ children }: any) {  
  const [loading, setLoading] = useState<boolean>(false);

  const value = { loading, setLoading };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

// 3. Create a custom hook to use the context
export function useLoadingContext() {
  return useContext(LoadingContext);
}

