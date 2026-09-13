import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'write'
  | 'scene'
  | 'pipeline'
  | 'chevronLeft'
  | 'chevronRight'
  | 'close'
  | 'copy'
  | 'plus'
  | 'ai'
  | 'search'
  | 'command'
  | 'shots'
  | 'calendar'
  | 'trash'
  | 'arrowUp'
  | 'arrowDown'
  | 'cog'
  | 'portrait'
  | 'kit'
  | 'sun'
  | 'moon'
  | 'focus'
  | 'image'
  | 'upload'
  | 'edit'
  | 'clapper'
  | 'panel';

const paths: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" />
      <rect x="13.5" y="3.5" width="7" height="5" />
      <rect x="13.5" y="11.5" width="7" height="9" />
      <rect x="3.5" y="15.5" width="7" height="5" />
    </>
  ),
  write: (
    <>
      <path d="M6 3.5h8.5L18 7v13.5H6z" />
      <path d="M14.5 3.5V7H18" />
      <path d="M9 11h6M9 14h6M9 17h3.5" />
    </>
  ),
  scene: (
    <>
      <rect x="3.5" y="8" width="17" height="12.5" />
      <path d="M3.5 8l2.2-4.5 16 3.5" />
      <path d="M9 4.7L8 8M15 5.9L14 8" />
    </>
  ),
  pipeline: (
    <>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
      <circle cx="8" cy="6.5" r="1.6" fill="currentColor" />
      <circle cx="14" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="17.5" r="1.6" fill="currentColor" />
    </>
  ),
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" />
      <path d="M15.5 8.5V4.5h-11v11h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  ai: (
    <>
      <rect x="5" y="5" width="14" height="14" />
      <rect x="9.5" y="9.5" width="5" height="5" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M15.5 15.5L20 20" />
    </>
  ),
  shots: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" />
      <path d="M8 5.5v13M3.5 9h4.5M3.5 15h4.5M11 10h6.5M11 14h4.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" />
      <path d="M3.5 10h17M8 3v5M16 3v5" />
      <rect x="7" y="13" width="3" height="3" fill="currentColor" stroke="none" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
    </>
  ),
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  command: <path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H17.5A2.5 2.5 0 1 0 15 6.5v11a2.5 2.5 0 1 0 2.5-2.5h-11A2.5 2.5 0 1 0 9 17.5z" />,
  cog: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.6 6.4l-1.7 1.7M8.1 15.9l-1.7 1.7M17.6 17.6l-1.7-1.7M8.1 8.1 6.4 6.4" />
    </>
  ),
  portrait: (
    <>
      <rect x="5" y="3.5" width="14" height="17" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18c1-2.6 3.1-4 5.5-4s4.5 1.4 5.5 4" />
    </>
  ),
  kit: (
    <>
      <rect x="3.5" y="9" width="17" height="10.5" />
      <path d="M8.5 9V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />
      <path d="M3.5 13.5h17" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7M18.1 18.1l-1.7-1.7M7.6 7.6 5.9 5.9" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />,
  focus: (
    <>
      <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" />
      <circle cx="9" cy="10" r="1.7" />
      <path d="M4.5 17.5 9.5 13l3 2.6 3.5-4 3.5 4.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5V4.5M7 9l5-5 5 5" />
      <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </>
  ),
  edit: (
    <>
      <path d="M15 4.5 19.5 9 8 20.5H3.5V16z" />
      <path d="M13 6.5 17.5 11" />
    </>
  ),
  clapper: (
    <>
      <path d="M3.5 10.5h17v9.5h-17z" />
      <path d="M3.5 10.5 5 5.5l14.5 2.3-1.1 3z" />
      <path d="M7.7 6.2 6.4 9.9M12 6.9l-1.3 3.7" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" />
      <path d="M14.5 4.5v15" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
