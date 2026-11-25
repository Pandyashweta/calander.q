import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Layers,
  UploadCloud,
  X,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { CalendarEvent, CalendarLayer, ViewMode } from '../types/calendar';
import { buildIcs, downloadIcs, parseIcsEvents } from '../utils/icsExport';
import { formatDateKey } from '../utils/dateUtils';

interface ExportModalProps {
  open: boolean;
  anchorDate: Date;
  viewMode: ViewMode;
  visibleDays: Date[];
  events: CalendarEvent[];
  layers: CalendarLayer[];
  visibleLayerIds: Set<string>;
  timezone: string;
  onClose: () => void;
  onImportEvents?: (events: CalendarEvent[]) => void;
  showToast?: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  anchorDate,
  viewMode,
  visibleDays,
  events,
  layers,
  visibleLayerIds,
  timezone,
  onClose,
  onImportEvents,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export State
  const [scope, setScope] = useState<'current_view' | 'all' | 'custom'>('current_view');
  const [startDate, setStartDate] = useState(() =>
    formatDateKey(visibleDays[0] || anchorDate)
  );
  const [endDate, setEndDate] = useState(() =>
    formatDateKey(visibleDays[visibleDays.length - 1] || anchorDate)
  );
  const [onlyVisible, setOnlyVisible] = useState(true);

  // Import State
  const [isDragging, setIsDragging] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [importedRawEvents, setImportedRawEvents] = useState<CalendarEvent[]>([]);
  const [targetLayerId, setTargetLayerId] = useState<string>(() => {
    const personal = layers.find((l) => l.id === 'personal');
    return personal ? personal.id : layers[0]?.id || 'personal';
  });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentViewStart = formatDateKey(visibleDays[0] || anchorDate);
  const currentViewEnd = formatDateKey(visibleDays[visibleDays.length - 1] || anchorDate);

  // Filter events for Export according to options
  const targetEvents = useMemo(() => {
    return events.filter((ev) => {
      if (onlyVisible && !visibleLayerIds.has(ev.calendarId)) return false;

      if (scope === 'current_view') {
        if (ev.endDate < currentViewStart || ev.startDate > currentViewEnd) return false;
      } else if (scope === 'custom') {
        if (startDate && ev.endDate < startDate) return false;
        if (endDate && ev.startDate > endDate) return false;
      }
      return true;
    });
  }, [events, onlyVisible, visibleLayerIds, scope, currentViewStart, currentViewEnd, startDate, endDate]);

  // Duplicate analysis for preview events
  const previewAnalysis = useMemo(() => {
    if (importedRawEvents.length === 0) {
      return { duplicates: 0, newEvents: 0, items: [] };
    }

    const existingKeys = new Set(
      events.map((e) => `${e.startDate}__${(e.title || '').trim().toLowerCase()}`)
    );

    let duplicates = 0;
    let newEvents = 0;

    const items = importedRawEvents.map((ev) => {
      const key = `${ev.startDate}__${(ev.title || '').trim().toLowerCase()}`;
      const isDuplicate = existingKeys.has(key);
      if (isDuplicate) duplicates++;
      else newEvents++;
      return { event: ev, isDuplicate };
    });

    return { duplicates, newEvents, items };
  }, [importedRawEvents, events]);

  if (!open) return null;

  const handleExport = () => {
    const icsString = buildIcs(targetEvents, layers, {
      calendarName: 'calendar.q',
      timezone,
      scope,
      startDate: scope === 'current_view' ? currentViewStart : startDate,
      endDate: scope === 'current_view' ? currentViewEnd : endDate,
      onlyVisibleLayers: onlyVisible,
    });

    const dateSlug =
      scope === 'current_view'
        ? `${viewMode}-${currentViewStart}`
        : scope === 'custom'
        ? `${startDate}-to-${endDate}`
        : 'all-events';

    downloadIcs(`calendar-q-${dateSlug}.ics`, icsString);
    if (showToast) showToast(`Exported ${targetEvents.length} events to .ics`);
    onClose();
  };

  const processFileContent = (file: File) => {
    setIsProcessingFile(true);
    setImportedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const parsed = parseIcsEvents(text, targetLayerId);
        setImportedRawEvents(parsed);
        if (parsed.length === 0 && showToast) {
          showToast('No valid VEVENT records found in this .ics file.');
        }
      } catch (err) {
        console.error('Failed to parse .ics:', err);
        if (showToast) showToast('Error reading .ics file format.');
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      if (showToast) showToast('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileContent(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFileContent(file);
    }
  };

  const handleClearImport = () => {
    setImportedRawEvents([]);
    setImportedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!onImportEvents || importedRawEvents.length === 0) return;

    let finalEvents = previewAnalysis.items;
    if (skipDuplicates) {
      finalEvents = finalEvents.filter((item) => !item.isDuplicate);
    }

    const assigned = finalEvents.map((item) => ({
      ...item.event,
      calendarId: targetLayerId,
    }));

    if (assigned.length === 0) {
      if (showToast) showToast('No new events to import (all were duplicates).');
      return;
    }

    onImportEvents(assigned);
    if (showToast) {
      showToast(`Successfully imported ${assigned.length} events into selected calendar.`);
    }
    onClose();
  };

  const formatMinutesTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Title & Close */}
        <div className="px-5 py-3 border-b border-[#EFEFEF] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#3B9AE1]" />
            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
              Calendar Data Synchronization (.ics)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md hover:bg-[#F2F2F2] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EBEBEB] bg-[#F7F7F7] px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white rounded-t-md border-t border-x border-t-[#E5E5E5] border-x-[#E5E5E5]'
                : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.ics)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#1A1A1A] text-[#1A1A1A] bg-white rounded-t-md border-t border-x border-t-[#E5E5E5] border-x-[#E5E5E5]'
                : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Import (.ics)</span>
            {importedRawEvents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#3B9AE1]" />
            )}
          </button>
        </div>

        {/* Main Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[12.5px]">
          {activeTab === 'export' ? (
            /* =================== EXPORT TAB =================== */
            <>
              <div>
                <label className="block text-[12px] font-semibold text-[#404040] mb-2">
                  Export Date Range Scope
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E8] hover:bg-[#FBFBFB] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="scope"
                      value="current_view"
                      checked={scope === 'current_view'}
                      onChange={() => setScope('current_view')}
                      className="mt-0.5 accent-[#1A1A1A]"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-[#1A1A1A]">
                        Current View ({viewMode.toUpperCase()})
                      </div>
                      <div className="text-[11.5px] text-[#737373]">
                        {currentViewStart} to {currentViewEnd}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E8] hover:bg-[#FBFBFB] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="scope"
                      value="all"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="mt-0.5 accent-[#1A1A1A]"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-[#1A1A1A]">All Calendar Events</div>
                      <div className="text-[11.5px] text-[#737373]">
                        Export entire database across past and future dates
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E8] hover:bg-[#FBFBFB] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="scope"
                      value="custom"
                      checked={scope === 'custom'}
                      onChange={() => setScope('custom')}
                      className="mt-0.5 accent-[#1A1A1A]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#1A1A1A]">Custom Date Range</div>
                      {scope === 'custom' && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="block text-[10.5px] text-[#737373] mb-0.5">From</span>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full bg-white border border-[#DCDCDC] rounded px-2 py-1 text-[11.5px] text-[#1A1A1A]"
                            />
                          </div>
                          <div>
                            <span className="block text-[10.5px] text-[#737373] mb-0.5">To</span>
                            <input
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full bg-white border border-[#DCDCDC] rounded px-2 py-1 text-[11.5px] text-[#1A1A1A]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Visibility filter */}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <label className="flex items-center gap-2 cursor-pointer text-[#404040]">
                  <input
                    type="checkbox"
                    checked={onlyVisible}
                    onChange={(e) => setOnlyVisible(e.target.checked)}
                    className="rounded border-[#DCDCDC] accent-[#1A1A1A]"
                  />
                  <span>Export only currently enabled / visible calendar layers</span>
                </label>
              </div>

              {/* Summary */}
              <div className="bg-[#F8F9FA] border border-[#EBEBEB] rounded-lg p-3 text-[11.5px] text-[#555555] flex items-center justify-between gap-3">
                <span>
                  Ready to export <strong className="text-[#1A1A1A]">{targetEvents.length}</strong> events.
                </span>
                <span className="text-[10.5px] text-[#888888] font-mono">RFC 5545 iCalendar</span>
              </div>
            </>
          ) : (
            /* =================== IMPORT TAB =================== */
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".ics,text/calendar"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag & Drop File Zone */}
              {importedRawEvents.length === 0 ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-[#3B9AE1] bg-[#F0F7FD]'
                      : 'border-[#D9D9D9] hover:border-[#999999] bg-[#FAFAFA]'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-[#888888] mb-2" />
                  <p className="font-semibold text-[#1A1A1A] text-[13px] mb-1">
                    {isProcessingFile ? 'Parsing calendar file...' : 'Upload or Drag & Drop .ics file'}
                  </p>
                  <p className="text-[11.5px] text-[#737373] max-w-xs">
                    Compatible with exports from Google Calendar, Apple Calendar, Outlook, and other RFC 5545 calendar apps.
                  </p>
                  <button
                    type="button"
                    className="mt-3 px-3 py-1.5 rounded-md bg-white border border-[#D0D0D0] text-[#333333] text-[12px] font-medium shadow-2xs hover:bg-[#F5F5F5]"
                  >
                    Select File from Computer
                  </button>
                </div>
              ) : (
                /* Parsed Preview Section */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between bg-[#F8F9FA] p-3 rounded-lg border border-[#EBEBEB]">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileUp className="w-4 h-4 text-[#3B9AE1] shrink-0" />
                      <div className="truncate">
                        <span className="font-medium text-[#1A1A1A] block truncate">
                          {importedFileName || 'calendar.ics'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {importedRawEvents.length} events loaded
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImport}
                      className="text-[#737373] hover:text-red-600 p-1 rounded hover:bg-white text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear file and pick another"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* Destination Calendar Layer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[#404040] mb-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#666666]" />
                        <span>Destination Calendar</span>
                      </label>
                      <select
                        value={targetLayerId}
                        onChange={(e) => setTargetLayerId(e.target.value)}
                        className="w-full bg-white border border-[#D5D5D5] rounded-md px-2.5 py-1.5 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                      >
                        {layers.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F7F7F7] cursor-pointer text-[#333333] text-[11.5px]">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="rounded border-[#DCDCDC] accent-[#1A1A1A]"
                        />
                        <span>Skip potential duplicates ({previewAnalysis.duplicates})</span>
                      </label>
                    </div>
                  </div>

                  {/* Duplicate Detection Status */}
                  <div className="flex items-center justify-between text-[11.5px] px-1">
                    <span className="text-[#666666]">
                      Found <strong>{previewAnalysis.newEvents}</strong> new events and{' '}
                      <strong>{previewAnalysis.duplicates}</strong> potential duplicates
                    </span>
                    <span className="text-[10.5px] text-[#888888]">
                      {skipDuplicates
                        ? `Will import ${previewAnalysis.newEvents} events`
                        : `Will import ${importedRawEvents.length} events`}
                    </span>
                  </div>

                  {/* Events Preview Table */}
                  <div className="border border-[#E5E5E5] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11.5px]">
                      <thead className="bg-[#F6F6F6] border-b border-[#E5E5E5] sticky top-0 z-10 text-[#666666] font-medium">
                        <tr>
                          <th className="py-1.5 px-3">Title</th>
                          <th className="py-1.5 px-3">Date</th>
                          <th className="py-1.5 px-3">Time</th>
                          <th className="py-1.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F0] bg-white">
                        {previewAnalysis.items.map(({ event: ev, isDuplicate }, idx) => (
                          <tr
                            key={ev.id || idx}
                            className={`hover:bg-[#FAFAFA] ${
                              isDuplicate && skipDuplicates ? 'opacity-50 line-through bg-[#FDFDFD]' : ''
                            }`}
                          >
                            <td className="py-1.5 px-3 font-medium text-[#1A1A1A] truncate max-w-[150px]">
                              {ev.title}
                            </td>
                            <td className="py-1.5 px-3 text-[#555555] whitespace-nowrap">
                              {ev.startDate}
                            </td>
                            <td className="py-1.5 px-3 text-[#555555] whitespace-nowrap">
                              {ev.allDay
                                ? 'All day'
                                : `${formatMinutesTime(ev.startMinutes)}`}
                            </td>
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              {isDuplicate ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Duplicate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  New
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-[#888888]">
            {activeTab === 'export' ? 'RFC 5545 Standard' : 'Drag or select .ics'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-[#DCDCDC] bg-white hover:bg-[#F2F2F2] text-[#404040] text-[12.5px] font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'export' ? (
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#333333] text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ({targetEvents.length})</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={importedRawEvents.length === 0}
                onClick={handleConfirmImport}
                className="px-4 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>
                  Import (
                  {skipDuplicates
                    ? previewAnalysis.newEvents
                    : importedRawEvents.length}
                  )
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
