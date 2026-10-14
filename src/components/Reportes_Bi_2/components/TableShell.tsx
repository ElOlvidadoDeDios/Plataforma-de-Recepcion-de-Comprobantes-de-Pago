//TableShell.tsx

import { ReactNode } from 'react';

export function TableShell({ children }: { children: ReactNode }) {
  return (
    // Mantenemos overflow-x-auto solo como salvavidas para el "límite imposible"
    <div className="w-full overflow-x-auto shadow-sm rounded-lg border border-border scrollbar-thin">
      {/* Cambiamos min-w-max por w-full para permitir que la tabla se comprima */}
      <div className="w-full bg-white align-middle">
        {children}
      </div>
    </div>
  );
}