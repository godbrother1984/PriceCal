// path: client/src/components/ItemStatusBadge.tsx
// version: 1.0 (Item Status Badge Component)
// last-modified: 21 ตุลาคม 2568 14:30

import React from 'react';

interface ItemStatusBadgeProps {
  status: string; // 'AVAILABLE' | 'IN_USE' | 'MAPPED' | 'REPLACED' | 'PRODUCTION'
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const ItemStatusBadge: React.FC<ItemStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  // Status configuration
  const statusConfig = {
    AVAILABLE: {
      label: 'Available',
      icon: '🟢',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    IN_USE: {
      label: 'In Use',
      icon: '🟡',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    },
    MAPPED: {
      label: 'Mapped',
      icon: '🔵',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    REPLACED: {
      label: 'Replaced',
      icon: '⚫',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    },
    PRODUCTION: {
      label: 'Production',
      icon: '🟣',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.AVAILABLE;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

export default ItemStatusBadge;
