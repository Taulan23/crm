import React from 'react';

export const Card = ({ children, ...props }) => (
  <div className="bg-white shadow-md rounded-lg overflow-hidden" {...props}>
    {children}
  </div>
);
export const CardContent = ({ children, ...props }) => (
  <div className="p-6" {...props}>{children}</div>
);
export const CardHeader = ({ children, ...props }) => (
  <div className="px-6 py-4 bg-gray-50 border-b" {...props}>{children}</div>
);
export const CardTitle = ({ children, ...props }) => (
  <h3 className="text-lg font-semibold text-gray-900" {...props}>{children}</h3>
);
