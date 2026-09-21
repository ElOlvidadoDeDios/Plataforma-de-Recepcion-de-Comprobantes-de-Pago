//Panel.tsx

import { ReactNode } from 'react';

export function Panel({ title, icon, subtitle, eyebrow, children, action }: { title: string; subtitle?: string; icon?: ReactNode; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {icon && <div>{icon}</div>}
            <h2 className="font-display text-[17px] font-bold tracking-[-.025em]">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {eyebrow && <p className="mt-1 font-mono text-[9px] uppercase tracking-[.13em] text-muted-foreground">{eyebrow}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}