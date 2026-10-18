interface PlantIconProps {
  stage: "pot" | "growing" | "flower";
  className?: string;
}

export function PlantIcon({ stage, className = "size-16" }: PlantIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {stage === "growing" && (
        <g className="text-primary" fill="currentColor">
          <path d="M23 30V20h2v10z" />
          <ellipse cx="18" cy="19" rx="6" ry="3.5" transform="rotate(-25 18 19)" />
          <ellipse cx="30" cy="16" rx="6" ry="3.5" transform="rotate(25 30 16)" />
        </g>
      )}
      {stage === "flower" && (
        <g>
          <path d="M23 30V18h2v12z" className="text-primary" fill="currentColor" />
          <g className="text-primary" fill="currentColor">
            <circle cx="24" cy="9" r="4.5" />
            <circle cx="30" cy="14" r="4.5" />
            <circle cx="18" cy="14" r="4.5" />
            <circle cx="28" cy="19" r="4.5" />
            <circle cx="20" cy="19" r="4.5" />
          </g>
          <circle cx="24" cy="14" r="3.5" className="text-on-primary-container" fill="currentColor" />
        </g>
      )}
      <path
        d="M14 30h20l-3 14H17z"
        className={stage === "pot" ? "text-outline-variant" : "text-on-surface-variant"}
        fill="currentColor"
      />
    </svg>
  );
}
