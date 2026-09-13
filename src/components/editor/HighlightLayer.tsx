import { forwardRef, memo, type ReactNode } from 'react';
import type { LineType, ParsedLine } from '../../types';

interface LineViewProps {
  index: number;
  raw: string;
  type: LineType;
  start: number;
  prefix: number;
  suffix: number;
  /** Markering relativt radens start, -1 om ingen. */
  selS: number;
  selE: number;
  /** Markörposition relativt radens start, -1 om ingen. */
  caret: number;
  idle: boolean;
  sceneNo?: string;
}

const LineView = memo(function LineView({ index, raw, type, start, prefix, suffix, selS, selE, caret, idle, sceneNo }: LineViewProps) {
  const len = raw.length;
  const cuts = new Set<number>([0, len, prefix, len - suffix]);
  if (selS >= 0) {
    cuts.add(Math.min(selS, len));
    cuts.add(Math.min(selE, len));
  }
  if (caret >= 0) cuts.add(caret);
  const points = [...cuts].filter((n) => n >= 0 && n <= len).sort((a, b) => a - b);

  const children: ReactNode[] = [];
  if (sceneNo) {
    children.push(
      <span key="no" className="sp-scene-no">
        {sceneNo}
      </span>,
    );
  }
  const caretEl = <span key="caret" className={`sp-caret${idle ? ' is-idle' : ''}`} />;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a === b) continue;
    if (caret === a) children.push(caretEl);
    const mark = a < prefix || a >= len - suffix;
    const selected = selS >= 0 && a >= selS && b <= selE;
    const cls = `${mark ? 'sp-mark' : ''}${selected ? ' sp-sel' : ''}`.trim();
    children.push(
      <span key={a} data-o={start + a} className={cls || undefined}>
        {raw.slice(a, b)}
      </span>,
    );
  }
  if (caret === len) children.push(caretEl);
  // Markerad radbrytning syns som ett smalt fält.
  if (selS >= 0 && selE > len) {
    children.push(
      <span key="nl" className="sp-sel">
        {' '}
      </span>,
    );
  }

  return (
    <div data-line={index} data-start={start} data-len={len} className={`sp-line sp-${type}`}>
      {children}
    </div>
  );
});

interface HighlightLayerProps {
  lines: readonly ParsedLine[];
  selection?: { start: number; end: number } | null;
  caret?: number | null;
  caretIdle?: boolean;
  /** Scennummer i vänstermarginalen, per radindex. */
  sceneNumbers?: Record<number, string>;
}

/** Formaterad rendering av manusrader. Används av editorn (med markör) och scenvyn (skrivskyddad). */
export const HighlightLayer = forwardRef<HTMLDivElement, HighlightLayerProps>(function HighlightLayer(
  { lines, selection = null, caret = null, caretIdle = false, sceneNumbers = {} },
  ref,
) {
  const hasSel = selection !== null && selection.end > selection.start;
  return (
    <div ref={ref} className="sp-page" aria-hidden="true">
      {lines.map((l) => {
        const len = l.raw.length;
        const lineEnd = l.offset + len;
        let selS = -1;
        let selE = -1;
        if (hasSel && selection && selection.start <= lineEnd && selection.end > l.offset) {
          selS = Math.max(0, selection.start - l.offset);
          selE = Math.min(len + 1, selection.end - l.offset);
        }
        const c = caret !== null && caret >= l.offset && caret <= lineEnd ? caret - l.offset : -1;
        return (
          <LineView
            key={l.index}
            index={l.index}
            raw={l.raw}
            type={l.type}
            start={l.offset}
            prefix={l.markerPrefix}
            suffix={l.markerSuffix}
            selS={selS}
            selE={selE}
            caret={c}
            idle={caretIdle}
            sceneNo={sceneNumbers[l.index]}
          />
        );
      })}
    </div>
  );
});
