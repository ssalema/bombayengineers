import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { ConfirmDialog } from './ConfirmDialog';

/** Warns before leaving with unsaved changes (in-app navigation, reload or tab close). */
export function UnsavedChangesDialog({
  when,
  title = 'Discard unsaved changes?',
  message = 'You have unsaved changes. If you leave now, they will be lost.',
  confirmLabel = 'Discard and leave',
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (!when) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [when]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel="Keep editing"
      tone="warning"
      onConfirm={() => blocker.proceed?.()}
      onClose={() => blocker.reset?.()}
    />
  );
}
