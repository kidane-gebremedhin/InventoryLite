'use client'

import { APP_NAME } from "@/lib/app_config/config";
import Link from "next/link";
import { ROUTE_PATH } from "@/lib/Enums";

export default function Navbar() {

  return (
    <div>
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 md:flex md:justify-between md:items-center">
          <Link href="/" className="flex items-center space-x-2">
            {/* Using a simple SVG for a logo placeholder */}
            <svg
              className="w-8 h-8 text-teal-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h6a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href={ROUTE_PATH.PRODUCT_DEMO} className="text-gray-600 hover:text-teal-600">Demo</Link>
            <Link href={ROUTE_PATH.PRICING_PLAN}>
              Pricing
            </Link>
            <a href="#" className="text-gray-600 hover:text-teal-600">Contact</a>
            <Link href={ROUTE_PATH.SIGNIN} className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}