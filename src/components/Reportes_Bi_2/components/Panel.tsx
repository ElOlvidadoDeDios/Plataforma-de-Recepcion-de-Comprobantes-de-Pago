import React, { ReactNode } from 'react';

interface PanelProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, eyebrow, subtitle, icon, action, children, className = '' }: PanelProps) {
  return (
    <div 
      className={`
        flex flex-col rounded-2xl 
        border border-border/80 
        bg-white 
        shadow-sm hover:shadow-md transition-shadow duration-300
        ${className}
      `}
    >
      <div className="flex flex-col gap-4 border-b border-border/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground ring-1 ring-border/50">
              {icon}
            </div>
          )}
          <div>
            {eyebrow && <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
            <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] font-medium text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
}