// Three nodes joined by two lines — matches the viewBox/stroke idiom of the other icons in
// the Planning row (DownloadIcon/UploadIcon/StartOverIcon in ChartCard.tsx, PrintIcon).
export function ShareIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16.5" cy="5" r="2.6" />
      <circle cx="5.5" cy="11" r="2.6" />
      <circle cx="16.5" cy="17" r="2.6" />
      <path d="M7.9 9.7 L14.1 6.3 M7.9 12.3 L14.1 15.7" />
    </svg>
  );
}
