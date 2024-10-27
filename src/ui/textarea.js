import React from 'react';

export const Textarea = (props) => (
  <textarea
    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
    rows="4"
    {...props}
  />
);
