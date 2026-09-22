"use client";

type AuthFeedbackModalProps = {
  message: string;
  onClose: () => void;
  title?: string;
  actions?: React.ReactNode;
};

export default function AuthFeedbackModal({
  message,
  onClose,
  title = "Please check this",
  actions,
}: AuthFeedbackModalProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-feedback-modal-title"
    >
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="mb-4">
          <p
            id="auth-feedback-modal-title"
            className="text-lg font-black tracking-tight text-slate-900"
          >
            {title}
          </p>
        </div>
        <p className="text-sm font-medium leading-6 text-slate-600">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {actions}
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#1f4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d44b8]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
