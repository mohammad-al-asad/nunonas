export type ToastType = "success" | "error" | "info";

type ToastOptions = {
  type?: ToastType;
  duration?: number;
};

type ToastHandler = (message: string, options?: ToastOptions) => void;

let handler: ToastHandler | null = null;

export function registerToastHandler(nextHandler: ToastHandler | null) {
  handler = nextHandler;
}

export function showToast(message: string, options?: ToastOptions) {
  handler?.(message, options);
}
