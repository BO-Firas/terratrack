// Logo TerraTrack - cible GPS avec point central
// Utilisable a differentes tailles via la prop size
export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Anneaux concentriques - effet "cible GPS" */}
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" opacity="0.15" />
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="3" opacity="0.5" />
      <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="3" opacity="0.85" />
      {/* Point central */}
      <circle cx="50" cy="50" r="6" fill="currentColor" />
      {/* Croix de mire */}
      <line x1="50" y1="6" x2="50" y2="20" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="80" x2="50" y2="94" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <line x1="6" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <line x1="80" y1="50" x2="94" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    </svg>
  );
}
