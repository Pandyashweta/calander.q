import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { PendingGoogleMutation } from '../types/calendar';

interface ConfirmDialogProps {
  pending: PendingGoogleMutation | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  pending,
  busy,
  onCancel,
  onConfirm,
}) => {
  if (!pending) return null;

  const actionLabel =
    pending.type === 'delete'
      ? 'Delete from Google Calendar'
      : pending.type === 'create'
      ? 'Add to Google Calendar'
      : 'Update in Google Calendar';

  const confirmBtnStyle =
    pending.type === 'delete'
      ? 'bg-[#C81E2B] hover:bg-[#A61722] text-white'
      : 'bg-[#1A1A1A] hover:bg-[#333333] text-white';

  return (
    <div
      onClick={() => !busy && onCancel()}
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-gcal-title"
        className="w-full max-w-[420px] bg-white border border-[#E2E2E2] rounded-xl shadow-xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                pending.type === 'delete' ? 'text-[#C81E2B]' : 'text-[#D98E04]'
              }`}
            />
            <h2
              id="confirm-gcal-title"
              className="text-[14px] font-semibold text-[#1A1A1A]"
            >
              Confirm Google Calendar Change
            </h2>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            aria-label="Close confirmation"
            className="p-1 rounded hover:bg-[#F2F2F2] text-[#8C8C8C] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-[13px] text-[#3F3F3F]">
          <p className="leading-relaxed">
            {pending.type === 'delete'
              ? 'Are you sure you want to permanently delete this event from your Google Calendar?'
              : pending.type === 'create'
              ? 'Confirm adding this new event directly to your Google Calendar?'
              : 'Confirm updating this event in your Google Calendar?'}
          </p>

          <div className="rounded-lg bg-[#F9F9F9] border border-[#EAEAEA] p-3 space-y-1">
            <div className="font-semibold text-[#1A1A1A]">{pending.title}</div>
            <div className="text-[12px] text-[#666666] tabular-nums">
              {pending.dateSummary}
            </div>
            <div className="text-[11.5px] text-[#7A7A7A]">
              Calendar: <span className="font-medium text-[#3F3F3F]">{pending.calendarName}</span>
            </div>
            {pending.details && (
              <div className="text-[11.5px] text-[#7A7A7A] pt-0.5">{pending.details}</div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-md border border-[#DCDCDC] bg-white hover:bg-[#F3F3F3] text-[12.5px] font-medium text-[#3F3F3F] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors cursor-pointer disabled:opacity-50 ${confirmBtnStyle}`}
          >
            {busy ? 'Saving...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
