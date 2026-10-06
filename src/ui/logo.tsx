interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Marca de Jade: una "J" de bloque sobre una ficha rosa con borde y sombra
 * dura, ligeramente torcida como una pegatina.
 */
export function Logo({ size = 36, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <g transform="rotate(-6 16 16)">
        <rect x="6.5" y="6.5" width="22" height="22" rx="4" fill="#111111" />
        <rect x="4" y="4" width="22" height="22" rx="4" fill="#ff8fc7" stroke="#111111" strokeWidth="2" />
        <path fill="#111111" d="M10 8.5h11V11h-2.5v10.5H9.5V15H12v4h4V11h-6z" />
      </g>
    </svg>
  );
}
