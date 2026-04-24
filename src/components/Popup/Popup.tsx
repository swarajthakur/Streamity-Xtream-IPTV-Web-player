import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PopupProps {
  type?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Legacy font-awesome icon class, e.g. "fas fa-user-times". Ignored. */
  icon?: string;
  onclick?: () => void;
  error?: boolean;
  /** When true, <br/> strings inside description are converted to line breaks. */
  unsecure?: boolean;
}

function renderDescription(description: ReactNode, unsecure?: boolean) {
  if (unsecure && typeof description === 'string') {
    return description.split(/<br\s*\/?>/i).reduce<ReactNode[]>((acc, part, idx, arr) => {
      acc.push(<Fragment key={idx}>{part}</Fragment>);
      if (idx < arr.length - 1) acc.push(<br key={`br-${idx}`} />);
      return acc;
    }, []);
  }
  return description;
}

export default function Popup({ title, description, onclick, error = true, unsecure }: PopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setOpen(false);
    window.setTimeout(() => onclick?.(), 180);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={close}
      />

      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-neutral-900 text-neutral-50 shadow-2xl transition-all duration-200',
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between px-5 py-3',
            error ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-sky-500'
          )}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            {error ? <AlertTriangle className="size-4" /> : <Info className="size-4" />}
            {error ? 'Error' : 'Information'}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-full p-1 text-white/90 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pb-2 pt-6 text-center">
          <h4 className="text-xl font-semibold">{title}</h4>
          {description != null && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">
              {renderDescription(description, unsecure)}
            </p>
          )}
        </div>

        <div className="flex justify-center px-6 pb-6 pt-4">
          <Button
            autoFocus
            variant={error ? 'destructive' : 'default'}
            onClick={close}
          >
            Ok, got it
          </Button>
        </div>
      </div>
    </div>
  );
}
