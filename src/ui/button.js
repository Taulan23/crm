import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'medium', ...props }) => {
  const baseStyle = "font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "bg-transparent hover:bg-gray-100"
  };
  const sizes = {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2",
    large: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]}`} 
      {...props}
    >
      {children}
    </button>
  );
};
