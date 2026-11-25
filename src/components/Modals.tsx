import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Command, Globe, Keyboard, Search, X } from 'lucide-react';
import { CalendarLayer, FestivalItem, TimezoneOption, ViewMode } from '../types/calendar';
import { getAllFestivalsForYear } from '../data/festivalsAndDays';
import {
  COLOR_THEMES,
  MONTH_NAMES,
  TIMEZONE_OPTIONS,
  parseDateKey,
} from '../utils/dateUtils';

export type ActiveModal = null | 'command' | 'goto' | 'timezone' | 'shortcuts';

interface ModalsProps {
  activeModal: ActiveModal;
  anchorDate: Date;
  layers: CalendarLayer[];
  viewMode: ViewMode;
  anyCulturalVisible: boolean;
  showGujaratiCalendar: boolean;
  gujaratiScript: boolean;
  primaryTz: TimezoneOption;
  secondaryTz: TimezoneOption;
  onClose: () => void;
  onJumpToDate: (date: Date) => void;
  onJumpToFestival: (festival: FestivalItem) => void;
  onChangeView: (view: ViewMode) => void;
  onToggleLayer: (layerId: string) => void;
  onToggleAllCultural: () => void;
  onToggleGujaratiScript: () => void;
  onCreateEventNow: () => void;
  onSetPrimaryTz: (tz: TimezoneOption) => void;
  onSetSecondaryTz: (tz: TimezoneOption) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  anchorDate,
  layers,
  viewMode,
  anyCulturalVisible,
  showGujaratiCalendar,
  gujaratiScript,
  primaryTz,
  secondaryTz,
  onClose,
  onJumpToDate,
  onJumpToFestival,
  onChangeView,
  onToggleLayer,
  onToggleAllCultural,
  onToggleGujaratiScript,
  onCreateEventNow,
  onSetPrimaryTz,
  onSetSecondaryTz,
}) => {
  const [cmdQuery, setCmdQuery] = useState('');
  const [gotoDateValue, setGotoDateValue] = useState(() => {
    const y = anchorDate.getFullYear();
    const m = String(anchorDate.getMonth() + 1).padStart(2, '0');
    const d = String(anchorDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal) {
      setCmdQuery('');
      const y = anchorDate.getFullYear();
      const m = String(anchorDate.getMonth() + 1).padStart(2, '0');
      const d = String(anchorDate.getDate()).padStart(2, '0');
      setGotoDateValue(`${y}-${m}-${d}`);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [activeModal, anchorDate]);

  useEffect(() => {
    if (!activeModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeModal, onClose]);

  const majorFestivalsThisYear = useMemo(() => {
    if (activeModal !== 'goto' && activeModal !== 'command') return [];
    const all = getAllFestivalsForYear(anchorDate.getFullYear());
    return all.filter((f) => f.isMajor);
  }, [activeModal, anchorDate]);

  const commandActions = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    const items: Array<{
      id: string;
      label: string;
      hint?: string;
      category: string;
      action: () => void;
    }> = [
      {
        id: 'cmd-create',
        label: 'Create new event',
        hint: 'C',
        category: 'Actions',
        action: () => {
          onCreateEventNow();
          onClose();
        },
      },
      {
        id: 'cmd-toggle-all-cultural',
        label: anyCulturalVisible
          ? 'Hide all festivals, special days & Gujarati calendar'
          : 'Show all festivals, special days & Gujarati calendar',
        hint: 'H',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleAllCultural();
          onClose();
        },
      },
      {
        id: 'cmd-toggle-guj',
        label: showGujaratiCalendar
          ? 'Hide Gujarati Calendar (Vikram Samvat Tithi)'
          : 'Show Gujarati Calendar (Vikram Samvat Tithi)',
        hint: 'G',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleLayer('gujarati-calendar');
          onClose();
        },
      },
      {
        id: 'cmd-toggle-script',
        label: gujaratiScript
          ? 'Switch Gujarati labels to English transliteration'
          : 'Switch Gujarati labels to ગુજરાતી script',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleGujaratiScript();
          onClose();
        },
      },
      {
        id: 'cmd-toggle-ind',
        label: 'Toggle Indian Festivals layer',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleLayer('indian-festivals');
          onClose();
        },
      },
      {
        id: 'cmd-toggle-global',
        label: 'Toggle International Holidays & Special Days',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleLayer('global-days');
          onClose();
        },
      },
      {
        id: 'cmd-toggle-world-fest',
        label: 'Toggle World Calendar Festivals (Chinese, Hebrew, Islamic, Parsi...)',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleLayer('world-observances');
          onClose();
        },
      },
      {
        id: 'cmd-toggle-hol',
        label: 'Toggle National Holidays layer',
        category: 'Festivals & Panchang',
        action: () => {
          onToggleLayer('national-holidays');
          onClose();
        },
      },
      {
        id: 'cmd-view-day',
        label: 'Switch to Day view',
        hint: '1',
        category: 'Views',
        action: () => {
          onChangeView('day');
          onClose();
        },
      },
      {
        id: 'cmd-view-3days',
        label: 'Switch to 3 days view',
        hint: '3',
        category: 'Views',
        action: () => {
          onChangeView('3days');
          onClose();
        },
      },
      {
        id: 'cmd-view-5days',
        label: 'Switch to 5 days view',
        hint: '5',
        category: 'Views',
        action: () => {
          onChangeView('5days');
          onClose();
        },
      },
      {
        id: 'cmd-view-week',
        label: 'Switch to Week view (7 days)',
        hint: 'W',
        category: 'Views',
        action: () => {
          onChangeView('week');
          onClose();
        },
      },
      {
        id: 'cmd-view-month',
        label: 'Switch to Month view',
        hint: 'M',
        category: 'Views',
        action: () => {
          onChangeView('month');
          onClose();
        },
      },
    ];

    // Add major festivals as jump commands when searching
    const festItems = majorFestivalsThisYear.map((f) => {
      const d = parseDateKey(f.date);
      return {
        id: `cmd-fest-${f.id}`,
        label: `Jump to ${f.title}`,
        hint: `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`,
        category: `Major Festivals (${anchorDate.getFullYear()})`,
        action: () => {
          onJumpToFestival(f);
          onClose();
        },
      };
    });

    const combined = q ? [...items, ...festItems] : [...items, ...festItems.slice(0, 6)];
    if (!q) return combined;
    return combined.filter(
      (i) =>
        i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [
    cmdQuery,
    anyCulturalVisible,
    showGujaratiCalendar,
    gujaratiScript,
    majorFestivalsThisYear,
    anchorDate,
    onCreateEventNow,
    onToggleAllCultural,
    onToggleLayer,
    onToggleGujaratiScript,
    onChangeView,
    onJumpToFestival,
    onClose,
  ]);

  if (!activeModal) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] flex items-start justify-center pt-[11vh] px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] bg-white border border-[#E2E2E2] rounded-xl shadow-xl overflow-hidden"
      >
        {/* ================= COMMAND MENU (⌘K) ================= */}
        {activeModal === 'command' && (
          <div>
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#EFEFEF]">
              <Search className="w-4 h-4 text-[#8C8C8C] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Type a command, toggle festivals, or jump to Diwali..."
                className="flex-1 text-[13.5px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-[#F2F2F2] text-[#8C8C8C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[340px] overflow-y-auto cal-scroll p-2 space-y-0.5">
              {commandActions.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-[#8C8C8C]">
                  No matching commands or festivals.
                </div>
              ) : (
                commandActions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#1A1A1A] truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#8C8C8C]">{item.category}</div>
                    </div>
                    {item.hint && (
                      <kbd className="px-1.5 py-0.5 rounded bg-[#F0F0F0] border border-[#E2E2E2] text-[10.5px] font-mono-tabular text-[#6B6B6B] shrink-0">
                        {item.hint}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= GO TO DATE (.) ================= */}
        {activeModal === 'goto' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
                <Calendar className="w-4 h-4 text-[#737373]" />
                <span>Go to date or festival</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-[#F2F2F2] text-[#8C8C8C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!gotoDateValue) return;
                onJumpToDate(parseDateKey(gotoDateValue));
                onClose();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="date"
                value={gotoDateValue}
                onChange={(e) => setGotoDateValue(e.target.value)}
                className="flex-1 bg-white border border-[#DCDCDC] focus:border-[#3B9AE1] rounded-md px-3 py-2 text-[13px] tabular-nums text-[#1A1A1A] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-[12.5px] font-medium rounded-md transition-colors cursor-pointer"
              >
                Jump
              </button>
            </form>

            <div className="pt-2 border-t border-[#EFEFEF]">
              <div className="text-[11.5px] font-medium text-[#7A7A7A] mb-2">
                Jump to major {anchorDate.getFullYear()} festivals &amp; Gujarati days
              </div>
              <div className="max-h-[210px] overflow-y-auto cal-scroll grid grid-cols-1 gap-1">
                {majorFestivalsThisYear.map((fest) => {
                  const layer = layers.find((l) => l.id === fest.layerId);
                  const theme = COLOR_THEMES[layer?.color || 'saffron'];
                  const d = parseDateKey(fest.date);
                  return (
                    <button
                      key={fest.id}
                      type="button"
                      onClick={() => {
                        onJumpToFestival(fest);
                        onClose();
                      }}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#F5F5F5] text-left transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[2px] shrink-0"
                          style={{ backgroundColor: theme.dot }}
                        />
                        <span className="text-[12.5px] font-medium text-[#1A1A1A] truncate">
                          {fest.title}
                        </span>
                      </span>
                      <span className="text-[11.5px] text-[#7A7A7A] tabular-nums shrink-0">
                        {MONTH_NAMES[d.getMonth()].slice(0, 3)} {d.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= DUAL TIMEZONE MANAGER (+) ================= */}
        {activeModal === 'timezone' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
                <Globe className="w-4 h-4 text-[#737373]" />
                <span>Dual Timezone Columns</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-[#F2F2F2] text-[#8C8C8C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">
                  Primary timezone (right gutter column)
                </label>
                <select
                  value={primaryTz.id}
                  onChange={(e) => {
                    const found = TIMEZONE_OPTIONS.find((t) => t.id === e.target.value);
                    if (found) onSetPrimaryTz(found);
                  }}
                  className="w-full bg-white border border-[#DCDCDC] rounded-md px-3 py-2 text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.abbr} — {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">
                  Secondary timezone (left gutter column)
                </label>
                <select
                  value={secondaryTz.id}
                  onChange={(e) => {
                    const found = TIMEZONE_OPTIONS.find((t) => t.id === e.target.value);
                    if (found) onSetSecondaryTz(found);
                  }}
                  className="w-full bg-white border border-[#DCDCDC] rounded-md px-3 py-2 text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.abbr} — {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EFEFEF]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#1A1A1A] text-white text-[12.5px] font-medium rounded-md hover:bg-[#333333] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ================= ALL KEYBOARD SHORTCUTS (?) ================= */}
        {activeModal === 'shortcuts' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
                <Keyboard className="w-4 h-4 text-[#737373]" />
                <span>Keyboard shortcuts</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-[#F2F2F2] text-[#8C8C8C] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-[#F2F2F2] text-[12.5px]">
              {[
                { desc: 'Command menu', keys: ['⌘', 'K'] },
                { desc: 'Hide / Show all festivals, days & Gujarati calendar', keys: ['H'] },
                { desc: 'Toggle Gujarati Calendar (Vikram Samvat Tithi)', keys: ['G'] },
                { desc: 'Jump to Today', keys: ['T'] },
                { desc: 'Go to specific date or festival', keys: ['.'] },
                { desc: 'Create new event', keys: ['C'] },
                { desc: 'Share availability mode', keys: ['S'] },
                { desc: 'Quick team meeting input', keys: ['F'] },
                { desc: 'Switch views (Day / 3d / 5d / Week / Month)', keys: ['1', '3', '5', 'W', 'M'] },
                { desc: 'Previous / Next period', keys: ['←', '→'] },
                { desc: 'Toggle left sidebar', keys: ['['] },
                { desc: 'Toggle right context panel', keys: [']'] },
              ].map((row) => (
                <div
                  key={row.desc}
                  className="py-2 flex items-center justify-between gap-4"
                >
                  <span className="text-[#454545]">{row.desc}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {row.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 min-w-[20px] h-[20px] rounded-[4px] bg-[#F2F2F2] border border-[#E2E2E2] text-[11px] font-mono-tabular text-[#525252] inline-flex items-center justify-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
