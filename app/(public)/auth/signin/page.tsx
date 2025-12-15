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
      <div className="h-[420px] md:h-[700px] bg-gradient-to-tr from-green-500 to-teal-500 py-6 md:py-16 text-white">
        <div className="container mx-auto px-4 md:py-14">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">
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
