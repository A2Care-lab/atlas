import React from 'react';

type Props = {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function ClearFiltersButton({ onClick, className, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center text-sm font-semibold bg-transparent text-green-700 hover:text-green-800 ${className || ''}`}
    >
      {children || 'Limpar filtros'}
    </button>
  );
}
