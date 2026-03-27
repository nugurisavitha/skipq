import React from 'react';

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-text"
          style={{
            width: i === lines - 1 ? '80%' : '100%',
          }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`skeleton-circle ${className}`}
      style={{
        width: size,
        height: size,
      }}
    ></div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card bg-card-bg space-y-4 ${className}`}>
      <div className="skeleton h-48 rounded-lg"></div>
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 rounded w-3/4"></div>
        <div className="skeleton h-4 rounded w-full"></div>
        <div className="skeleton h-4 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Row */}
      <div className="skeleton-card bg-card-bg flex gap-4 p-4">
        <div className="skeleton h-4 rounded flex-1"></div>
        <div className="skeleton h-4 rounded flex-1"></div>
        <div className="skeleton h-4 rounded flex-1"></div>
        <div className="skeleton h-4 rounded w-20"></div>
      </div>

      {/* Body Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-card bg-card-bg flex gap-4 p-4">
          <div className="skeleton h-4 rounded flex-1"></div>
          <div className="skeleton h-4 rounded flex-1"></div>
          <div className="skeleton h-4 rounded flex-1"></div>
          <div className="skeleton h-4 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card bg-card-bg p-6 space-y-3">
            <div className="skeleton h-4 rounded w-1/2"></div>
            <div className="skeleton h-8 rounded w-3/4"></div>
            <div className="skeleton h-3 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="skeleton-card bg-card-bg p-6 space-y-4">
        <div className="skeleton h-4 rounded w-1/4"></div>
        <div className="skeleton h-64 rounded"></div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="skeleton h-4 rounded w-1/4"></div>
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
