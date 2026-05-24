'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { playSound } from '@/lib/sound';

// A heavily-guarded "delete everything" action: opens a modal that requires
// typing DELETE to confirm, then wipes all of the user's events server-side.
export default function DeleteAllEvents() {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [busy, setBusy] = useState(false);

    const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

    const close = () => {
        if (busy) return;
        setOpen(false);
        setConfirmText('');
    };

    const handleDelete = async () => {
        if (!canDelete || busy) return;
        setBusy(true);
        try {
            const res = await fetch('/api/events?all=true', { method: 'DELETE' });
            if (!res.ok) {
                if (res.status === 401) {
                    alert('Your session expired. Please sign in again.');
                } else {
                    alert('Failed to delete events. Please try again.');
                }
                setBusy(false);
                return;
            }
            playSound('delete');
            // Reload so the calendar refetches the now-empty schedule.
            window.location.reload();
        } catch (err) {
            console.error('Delete all failed:', err);
            alert('Failed to delete events. Please try again.');
            setBusy(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-red-400 hover:text-red-300 transition underline"
                title="Permanently delete every calendar event in your account"
            >
                Delete All Events
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={close}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Delete all events confirmation"
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-red-500/50 bg-black p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle size={20} />
                                <h2 className="text-sm font-black uppercase tracking-widest">Danger Zone</h2>
                            </div>
                            <button onClick={close} aria-label="Close" className="text-white/50 transition hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="mb-4 text-sm leading-relaxed text-cyan-100/80">
                            This permanently deletes <b className="text-red-400">every calendar event</b> in your
                            account, including recurring routines. This <b>cannot be undone</b>.
                        </p>

                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/60">
                            Type <span className="text-red-400">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                            autoFocus
                            disabled={busy}
                            placeholder="DELETE"
                            className="mb-5 w-full rounded-lg border border-red-500/40 bg-black/60 px-3 py-2 font-mono text-sm text-white outline-none transition focus:border-red-400"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={close}
                                disabled={busy}
                                className="rounded-lg border border-cyan-500/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/10 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!canDelete || busy}
                                className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {busy ? 'Deleting…' : 'Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
