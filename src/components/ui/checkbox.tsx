import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId();
    const checkboxId = id ?? autoId;
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={cn(
              'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border border-neutral-600 bg-neutral-900 checked:border-brand checked:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {label != null && (
          <label htmlFor={checkboxId} className="cursor-pointer select-none text-sm text-neutral-200">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
