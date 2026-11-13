import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface FieldWrapperProps {
  id: string;
  label: string;
  clauseRef?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  id,
  label,
  clauseRef,
  required,
  hint,
  error,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-800 leading-snug"
        >
          {clauseRef && (
            <span className="font-mono text-xs font-semibold text-blue-700 mr-2 tabular-nums">
              {clauseRef}
            </span>
          )}
          <span>{label}</span>
          {required && (
            <span className="text-red-600 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>
      {hint && <p className="text-xs text-slate-500 leading-relaxed">{hint}</p>}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-red-700 pt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export const baseInputClass = (hasError?: boolean, disabled?: boolean) =>
  `w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
    disabled
      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
      : hasError
      ? 'bg-red-50/40 border-red-400'
      : 'bg-white border-slate-300 hover:border-slate-400'
  }`;

export const GuidanceCallout: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
    <div className="flex items-start gap-2.5">
      <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="space-y-1.5 min-w-0">
        <p className="font-semibold text-amber-950 text-xs uppercase tracking-wide">
          {title}
        </p>
        <div className="text-xs leading-relaxed text-amber-900 space-y-1">{children}</div>
      </div>
    </div>
  </div>
);

export const NaCheckboxRow: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ id, checked, onChange, label = 'Mark as Not applicable' }) => (
  <label
    htmlFor={id}
    className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none py-1"
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
    />
    <span>{label}</span>
  </label>
);
