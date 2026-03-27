import React from 'react';
import { Link } from 'react-router-dom';
import { FiLock, FiArrowLeft } from 'react-icons/fi';

export default function Unauthorized() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center">
        <FiLock className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          You don't have permission to access this page. Please contact support if you believe this is an error.
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
