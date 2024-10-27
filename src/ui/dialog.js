import React from 'react';

export const Dialog = ({ children, ...props }) => <div {...props}>{children}</div>;
export const DialogContent = ({ children, ...props }) => <div {...props}>{children}</div>;
export const DialogHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
export const DialogTitle = ({ children, ...props }) => <h2 {...props}>{children}</h2>;
export const DialogTrigger = ({ children, ...props }) => <div {...props}>{children}</div>;
