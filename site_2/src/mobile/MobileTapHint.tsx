interface Props {
  onDismiss: () => void;
}

export function MobileTapHint({ onDismiss }: Props) {
  return (
    <div className="m-tap-hint" role="status">
      <span className="m-tap-hint-arrow" aria-hidden>
        ▾
      </span>
      <span>Tap the bar to see how evidence moved this</span>
      <button type="button" className="m-tap-hint-dismiss" onClick={onDismiss} aria-label="Dismiss hint">
        ✕
      </button>
    </div>
  );
}
