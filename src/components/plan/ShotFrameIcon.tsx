import { useId } from 'react';
import type { ShotType } from '../../types';

interface ShotFrameIconProps {
  type: ShotType;
  size?: number;
  className?: string;
}

/** Enkel siluett: huvud + axlar/bål, klipps mot ramen så att kroppen kan "gå av bild". */
function Person({
  cx,
  headCy,
  r,
  shoulderTopY,
  halfWidth,
  bottomY,
}: {
  cx: number;
  headCy: number;
  r: number;
  shoulderTopY: number;
  halfWidth: number;
  bottomY: number;
}) {
  const shoulderHalf = r * 1.05;
  return (
    <g fill="none" stroke="currentColor">
      <circle cx={cx} cy={headCy} r={r} />
      <path
        d={`M${cx - shoulderHalf} ${shoulderTopY} Q${cx} ${shoulderTopY - r * 0.5} ${cx + shoulderHalf} ${shoulderTopY} L${cx + halfWidth} ${bottomY} L${cx - halfWidth} ${bottomY} Z`}
      />
    </g>
  );
}

/**
 * Små "skiss"-ikoner per bildutsnitt — huvud/kropp skalas och klipps mot bildrutan
 * för att visa hur mycket av personen som syns (helbild → extrem närbild), plus
 * särskilda kompositioner för över-axel, subjektiv, insert och cutaway.
 */
export function ShotFrameIcon({ type, size = 28, className }: ShotFrameIconProps) {
  const rawId = useId();
  const clipId = `sfi-${rawId}`;

  let content: JSX.Element;
  switch (type) {
    case 'EST':
      content = (
        <>
          <path d="M2.5 17.5h27" stroke="currentColor" fill="none" />
          <path d="M6 17.5v-2.2h1.8v2.2M22 17.5v-3.2h2.6v3.2" stroke="currentColor" fill="none" />
          <Person cx={16} headCy={14.4} r={0.9} shoulderTopY={15.6} halfWidth={1.3} bottomY={17.5} />
        </>
      );
      break;
    case 'WS':
      content = <Person cx={16} headCy={9.5} r={2.3} shoulderTopY={12.2} halfWidth={3.6} bottomY={21} />;
      break;
    case 'MASTER':
      content = (
        <>
          <Person cx={9.5} headCy={11} r={1.7} shoulderTopY={13} halfWidth={2.6} bottomY={20} />
          <Person cx={16} headCy={10.6} r={1.7} shoulderTopY={12.6} halfWidth={2.6} bottomY={20.4} />
          <Person cx={22.5} headCy={11} r={1.7} shoulderTopY={13} halfWidth={2.6} bottomY={20} />
        </>
      );
      break;
    case 'MS':
      content = <Person cx={16} headCy={8} r={3.1} shoulderTopY={11.2} halfWidth={5} bottomY={23} />;
      break;
    case 'MCU':
      content = <Person cx={16} headCy={7.2} r={4} shoulderTopY={10.6} halfWidth={6.2} bottomY={26} />;
      break;
    case 'CU':
      content = <Person cx={16} headCy={8.5} r={5.6} shoulderTopY={13} halfWidth={7.8} bottomY={28} />;
      break;
    case 'ECU':
      content = (
        <>
          <circle cx={16} cy={11} r={8.5} fill="none" stroke="currentColor" />
          <path d="M11.5 10.5h3M17.5 10.5h3" stroke="currentColor" />
        </>
      );
      break;
    case '2-SHOT':
      content = (
        <>
          <Person cx={10.5} headCy={9} r={2.5} shoulderTopY={11.8} halfWidth={3.6} bottomY={23} />
          <Person cx={21.5} headCy={9} r={2.5} shoulderTopY={11.8} halfWidth={3.6} bottomY={23} />
        </>
      );
      break;
    case 'GROUP':
      content = (
        <>
          <Person cx={6.5} headCy={12} r={1.3} shoulderTopY={13.6} halfWidth={2} bottomY={20} />
          <Person cx={12.5} headCy={10.6} r={1.4} shoulderTopY={12.3} halfWidth={2.1} bottomY={21} />
          <Person cx={19} headCy={10.6} r={1.4} shoulderTopY={12.3} halfWidth={2.1} bottomY={21} />
          <Person cx={25} headCy={12} r={1.3} shoulderTopY={13.6} halfWidth={2} bottomY={20} />
        </>
      );
      break;
    case 'OTS':
      content = (
        <>
          <path d="M0 24V15c2-3 6-4.5 9-2.4V24z" fill="currentColor" stroke="none" opacity={0.85} />
          <Person cx={21} headCy={9.5} r={2.1} shoulderTopY={12} halfWidth={3.2} bottomY={20} />
        </>
      );
      break;
    case 'POV':
      content = (
        <>
          <path d="M4 6V3h3M28 6V3h-3M4 18v3h3M28 18v3h-3" stroke="currentColor" fill="none" />
          <circle cx={16} cy={12} r={4.4} fill="none" stroke="currentColor" />
          <circle cx={16} cy={12} r={1.3} fill="currentColor" stroke="none" />
        </>
      );
      break;
    case 'INSERT':
      content = (
        <>
          <rect x={11} y={7} width={10} height={10} rx={0.5} fill="none" stroke="currentColor" />
          <path d="M13.2 12h5.6M16 8.8v6.4" stroke="currentColor" />
        </>
      );
      break;
    case 'CUTAWAY':
      content = (
        <>
          <path d="M3 5.5h11v8H3z" fill="none" stroke="currentColor" opacity={0.5} />
          <rect x={16} y={11} width={13} height={9} rx={0.5} fill="none" stroke="currentColor" />
        </>
      );
      break;
    default:
      content = <Person cx={16} headCy={9.5} r={2.3} shoulderTopY={12.2} halfWidth={3.6} bottomY={21} />;
  }

  return (
    <svg
      width={size}
      height={(size * 24) / 32}
      viewBox="0 0 32 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={1.25} y={1.25} width={29.5} height={21.5} rx={1.2} />
        </clipPath>
      </defs>
      <rect x={1.25} y={1.25} width={29.5} height={21.5} rx={1.2} />
      <g clipPath={`url(#${clipId})`}>{content}</g>
    </svg>
  );
}
