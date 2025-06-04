import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  estado: 'pendiente' | 'parcial' | 'atendido';
}

export const badgeStyles = {
  atendido: "flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full",
  parcial: "flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full",
  pendiente: "flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full"
};

export const statusText = {
  atendido: 'Atendido',
  parcial: 'Parcialmente Atendido',
  pendiente: 'Pendiente'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado }) => {
  return (
    <div className={badgeStyles[estado]}>
      {estado === 'atendido' ? (
        <CheckCircle className="w-4 h-4 mr-1" />
      ) : (
        <Clock className="w-4 h-4 mr-1" />
      )}
      <span>{statusText[estado]}</span>
    </div>
  );
};

export default StatusBadge;