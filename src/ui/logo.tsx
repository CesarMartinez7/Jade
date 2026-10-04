interface LogoProps {
  size?: number;
  className?: string;
}

/** Marca de Jade: una gema tallada con un corte diagonal. Usa `currentColor`. */
export function Logo({ size = 18, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 1.5 21.5 9.5 18.98 12.94 4.45 7.86Z" />
      <path d="M2.5 9.5 17.7 14.7 12 22.5Z" />
    </svg>
  );
}
