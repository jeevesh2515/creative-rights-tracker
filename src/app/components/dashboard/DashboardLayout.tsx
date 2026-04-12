'use client';

import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout = React.memo<DashboardLayoutProps>(({ children, className = '' }) => {
  return (
    <div
      className={`
        grid 
        grid-cols-1 
        md:grid-cols-2 
        lg:grid-cols-3 
        gap-6 
        p-4 
        sm:p-6 
        lg:p-8 
        bg-white
        min-h-screen
        ${className}
      `}
    >
      {children}
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
