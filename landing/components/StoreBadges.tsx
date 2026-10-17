import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

function AppleLogo() {
  return (
    <svg viewBox="0 0 384 512" className="h-7 w-7 fill-current" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 512 512" className="h-6 w-6" aria-hidden="true">
      <path fill="#00d7fe" d="M48 59.5v393c0 9 5 16.9 12.4 20.9L288 256 60.4 38.6C53 42.6 48 50.5 48 59.5z" />
      <path fill="#ffce00" d="m373.6 170.9-85.6 85.1 85.6 85.1 77.3-44c14.8-8.4 14.8-29.8 0-38.2z" />
      <path fill="#00f076" d="M288 256 60.4 38.6c8.2-4.4 18.6-4.6 27.4.4l285.8 131.9z" />
      <path fill="#ff3a44" d="m288 256-227.6 217.4c8.2 4.4 18.6 4.2 27.4-.8l285.8-131.5z" />
    </svg>
  );
}

const badgeClass =
  "flex items-center gap-3 rounded-xl bg-ink px-5 py-3 text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-black";

export function StoreBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={badgeClass}>
        <AppleLogo />
        <span className="text-left leading-tight">
          <span className="block text-[11px] text-slate-300">Download on the</span>
          <span className="block text-lg font-semibold">App Store</span>
        </span>
      </a>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={badgeClass}>
        <PlayLogo />
        <span className="text-left leading-tight">
          <span className="block text-[11px] uppercase tracking-wide text-slate-300">Get it on</span>
          <span className="block text-lg font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
