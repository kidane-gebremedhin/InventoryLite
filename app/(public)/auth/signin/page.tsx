'use client'

import { Auth } from "@/components/auth/Auth";
import MiniLoading from "@/components/helpers/MiniLoading";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";

export default function HomePage() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    });

    if (!isMounted) return <MiniLoading />

  return (
    <>
    <div className="bg-gradient-to-tr from-green-500 to-teal-500 py-20 md:py-16 text-white" style={{height: 700}}>
      <div className="container mx-auto px-4 py-14">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Demand and Inventory Management Simplified!
            </h1>
          </div>
          
          <div className="card">
            <AuthProvider>
              <Auth />
            </AuthProvider>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
