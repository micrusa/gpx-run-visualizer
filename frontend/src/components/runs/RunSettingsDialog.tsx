import { useEffect, useRef, type ReactNode } from "react";

type Props = { id: string; title: string; open: boolean; onClose: () => void; children: ReactNode };

export function RunSettingsDialog({ id, title, open, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    else if (!open && element?.open) element.close();
  }, [open]);
  return <dialog ref={dialog} id={id} className="run-settings-dialog" aria-modal="true" aria-labelledby={`${id}-title`}
    onCancel={onClose} onClose={onClose} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="run-settings-heading"><h2 id={`${id}-title`}>{title}</h2>
      <button className="run-settings-close" type="button" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>×</button>
    </div>
    {children}
  </dialog>;
}
