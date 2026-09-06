export function Coin({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5h-1.5a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-1.5a2.5 2.5 0 0 1-2.5-1.5" />
      <path d="M12 7v1.5M12 15.5V17" />
    </svg>
  );
}
