import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { ModelBadge, type ModelSourceTag } from "./B10InfoTip";

const SHOW_DELAY_MS = 120;
const HIDE_DELAY_MS = 60;

interface Props {
  summary: string;
  detail?: ReactNode;
  source?: ModelSourceTag;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra body shown above summary (e.g. step-specific stats). */
  body?: ReactNode;
  /** When true, keep popover open while pointer is over it. */
  interactive?: boolean;
}

export function B10Popover({
  summary,
  detail,
  source,
  children,
  className = "",
  style,
  body,
  interactive = true
}: Props) {
  const popoverId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"below" | "above">("below");

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const scheduleShow = useCallback(() => {
    clearTimers();
    showTimer.current = setTimeout(() => {
      const anchor = anchorRef.current;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        setPlacement(rect.bottom > window.innerHeight - 140 ? "above" : "below");
      }
      setOpen(true);
    }, SHOW_DELAY_MS);
  }, [clearTimers]);

  const scheduleHide = useCallback(() => {
    clearTimers();
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <span
      ref={anchorRef}
      className={`b10-popover-anchor ${className}`.trim()}
      style={style}
      tabIndex={0}
      aria-describedby={open ? popoverId : undefined}
      onPointerEnter={scheduleShow}
      onPointerLeave={scheduleHide}
      onFocus={scheduleShow}
      onBlur={scheduleHide}
    >
      {children}
      {open ? (
        <span
          id={popoverId}
          role="tooltip"
          className={`b10-popover-panel placement-${placement}`}
          onPointerEnter={interactive ? clearTimers : undefined}
          onPointerLeave={interactive ? scheduleHide : undefined}
        >
          {source ? <ModelBadge source={source} /> : null}
          {body ? <div className="b10-popover-body">{body}</div> : null}
          <strong className="b10-popover-summary">{summary}</strong>
          {detail ? (
            <details className="b10-popover-why">
              <summary>Why?</summary>
              <div className="b10-popover-detail">{detail}</div>
            </details>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
