"use client";

interface ToastProps {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  description?: string;
  onClose: () => void;
}

export function Toast({
  isOpen,
  type,
  title,
  description,
  onClose,
}: ToastProps) {
  if (!isOpen) return null;

  const colors = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      icon: "bg-emerald-100 text-emerald-600",
    },
    error: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      icon: "bg-rose-100 text-rose-600",
    },
  }[type];

  return (
    <div
      className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${colors.bg} ${colors.border} ${colors.text} animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${colors.icon}`}>
        {type === "success" ? "✓" : "⚠"}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs opacity-80 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="ml-auto mt-0.5 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
      >
        Dismiss
      </button>
    </div>
  );
}
