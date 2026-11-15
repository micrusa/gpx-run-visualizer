type Props = { label: string; dialogId: string; open: boolean; onClick: () => void };

export function RunConfigButton({ label, dialogId, open, onClick }: Props) {
  return <button className="run-config-button" type="button" aria-label={label} title={label}
    aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={onClick}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z" />
      <circle cx="10" cy="11" r="3" />
    </svg>
  </button>;
}
