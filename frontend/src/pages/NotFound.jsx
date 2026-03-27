import React from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center">
        <FiSearch className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</p>
        <p className="text-gray-600 mb-8 max-w-md">
          Sorry, the page you're looking for doesn't exist. It might have been removed or the URL might be incorrect.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 btn-primary"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Go Home</span>
        </Link>
      </div>
    </div>
  );
}
