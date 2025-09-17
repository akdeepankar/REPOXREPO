"use client";
import React from "react";

export default function Modal({ open, onClose, children, maxWidth = "md", padding = "p-6", className = "", style = {} }) {
  if (!open) return null;
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  // Tailwind max-width classes: sm, md, lg, xl, 2xl
  const maxWidthClass = `max-w-${maxWidth}`;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidthClass} ${padding} relative animate-fadeIn ${className}`}
        style={{ minHeight: 'auto', maxHeight: '80vh', ...style }}
      >
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
