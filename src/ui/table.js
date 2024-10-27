import React from 'react';

export const Table = ({ children, ...props }) => (
  <table className="min-w-full divide-y divide-gray-200" {...props}>{children}</table>
);
export const TableBody = ({ children, ...props }) => (
  <tbody className="bg-white divide-y divide-gray-200" {...props}>{children}</tbody>
);
export const TableCell = ({ children, ...props }) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" {...props}>{children}</td>
);
export const TableHead = ({ children, ...props }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>{children}</th>
);
export const TableHeader = ({ children, ...props }) => (
  <thead className="bg-gray-50" {...props}>{children}</thead>
);
export const TableRow = ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
);
