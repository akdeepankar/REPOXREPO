import React from 'react';
import clsx from 'clsx';

// Simple Tailwind button variant system (minimal subset)
export function Button({
  as: Comp = 'button',
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm';
  const variants = {
    default: 'bg-[#7c5cff] text-white hover:bg-[#6b4ee6] focus:ring-[#7c5cff]',
    outline: 'border border-[#7c5cff] text-[#7c5cff] bg-white hover:bg-[#f3f0ff] focus:ring-[#7c5cff]',
    soft: 'bg-[#f3f0ff] text-[#7c5cff] hover:bg-[#e6e0ff] focus:ring-[#7c5cff]',
    danger: 'bg-[#ffeaea] text-[#d32f2f] border border-[#d32f2f] hover:bg-[#ffd6d6]',
    success: 'bg-[#eafbe7] text-[#388e3c] border border-[#388e3c] hover:bg-[#d6f5d6]',
  };
  const sizes = {
    sm: 'text-sm h-8 px-3',
    md: 'text-sm h-10 px-4',
    lg: 'text-base h-12 px-6',
  };
  return (
    <Comp className={clsx(base, variants[variant] || variants.default, sizes[size], className)} {...props} />
  );
}
