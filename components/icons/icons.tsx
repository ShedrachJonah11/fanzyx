import type { SVGProps } from "react";

/**
 * Brand social icons in their real colours (so they read like the actual
 * logos, not monochrome placeholders). Sized via `className` — e.g.
 * `<InstagramIcon className="size-4" />`.
 */

export function InstagramIcon({
  id = "fanzyx-ig-gradient",
  ...props
}: SVGProps<SVGSVGElement> & { id?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id={id} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F58529" />
          <stop offset="0.35" stopColor="#DD2A7B" />
          <stop offset="0.7" stopColor="#8134AF" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect
        x={2.5}
        y={2.5}
        width={19}
        height={19}
        rx={5}
        stroke={`url(#${id})`}
        strokeWidth={2}
      />
      <circle
        cx={12}
        cy={12}
        r={4}
        stroke={`url(#${id})`}
        strokeWidth={2}
      />
      <circle cx={17.5} cy={6.5} r={1.2} fill={`url(#${id})`} />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  // X is monochrome by design — render in currentColor so the surrounding
  // pill decides the exact shade (white on dark, black on light).
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21l-6.53 7.463L22 22h-6.828l-4.77-6.243L4.9 22H2.14l7.03-8.036L2 2h6.914l4.319 5.71L18.244 2Zm-2.393 18.375h1.887L7.24 3.512H5.22l10.63 16.863Z" />
    </svg>
  );
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      {/* Cyan shadow */}
      <path
        d="M20 8.6a7.7 7.7 0 0 1-4.5-1.44v8.28A5.56 5.56 0 1 1 9.94 10v2.83a2.73 2.73 0 1 0 1.9 2.6V2h2.75a4.86 4.86 0 0 0 4.87 4.86H20Z"
        fill="#25F4EE"
      />
      {/* Pink shadow */}
      <path
        d="M21 7.6a7.7 7.7 0 0 1-4.5-1.44v8.28A5.56 5.56 0 1 1 10.94 9v2.83a2.73 2.73 0 1 0 1.9 2.6V1h2.75a4.86 4.86 0 0 0 4.87 4.86H21Z"
        fill="#FE2C55"
      />
      {/* White fill on top */}
      <path
        d="M20.5 8.1a7.7 7.7 0 0 1-4.5-1.44v8.28A5.56 5.56 0 1 1 10.44 9.5v2.83a2.73 2.73 0 1 0 1.9 2.6V1.5h2.75a4.86 4.86 0 0 0 4.87 4.86h.54Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WebsiteIcon({
  id = "fanzyx-web-gradient",
  ...props
}: SVGProps<SVGSVGElement> & { id?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id={id} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4340FA" />
          <stop offset="0.5" stopColor="#6929FC" />
          <stop offset="1" stopColor="#FD23A7" />
        </linearGradient>
      </defs>
      <circle cx={12} cy={12} r={9} stroke={`url(#${id})`} strokeWidth={2} />
      <path
        d="M3 12h18"
        stroke={`url(#${id})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M12 3a13.5 13.5 0 0 1 0 18a13.5 13.5 0 0 1 0-18Z"
        stroke={`url(#${id})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
