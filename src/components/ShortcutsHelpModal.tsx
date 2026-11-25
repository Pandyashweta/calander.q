import React, { useMemo, useState } from 'react';
import { Keyboard, Search, X } from 'lucide-react';

interface ShortcutItem {
  id: string;
  category: 'Navigation' | 'Views' | 'Events & Actions' | 'Panels & Layout' | 'Calendars';
  description: string;
  keysMac: string[];
  keysWin: string[];
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  {
    id: 'today',
    category: 'Navigation',
    description: 'Jump to current date (Today)',
    keysMac: ['T'],
    keysWin: ['T'],
  },
  {
    id: 'prev-period',
    category: 'Navigation',
    description: 'Navigate to previous day, week, or month',
    keysMac: ['←'],
    keysWin: ['←'],
  },
  {
    id: 'next-period',
    category: 'Navigation',
    description: 'Navigate to next day, week, or month',
    keysMac: ['→'],
    keysWin: ['→'],
  },
  {
    id: 'goto-date',
    category: 'Navigation',
    description: 'Open date & festival picker modal',
    keysMac: ['.'],
    keysWin: ['.'],
  },

  // Views
  {
    id: 'view-day',
    category: 'Views',
    description: 'Switch to Day view',
    keysMac: ['1'],
    keysWin: ['1'],
  },
  {
    id: 'view-3days',
    category: 'Views',
    description: 'Switch to 3-day view',
    keysMac: ['3'],
    keysWin: ['3'],
  },
  {
    id: 'view-5days',
    category: 'Views',
    description: 'Switch to 5-day view',
    keysMac: ['5'],
    keysWin: ['5'],
  },
  {
    id: 'view-week',
    category: 'Views',
    description: 'Switch to Week view',
    keysMac: ['W'],
    keysWin: ['W'],
  },
  {
    id: 'view-month',
    category: 'Views',
    description: 'Switch to Month view',
    keysMac: ['M'],
    keysWin: ['M'],
  },

  // Events & Actions
  {
    id: 'create-event',
    category: 'Events & Actions',
    description: 'Create new calendar event at next hour',
    keysMac: ['C'],
    keysWin: ['C'],
  },
  {
    id: 'quick-meet',
    category: 'Events & Actions',
    description: 'Focus quick team meeting input in panel',
    keysMac: ['F'],
    keysWin: ['F'],
  },
  {
    id: 'share-mode',
    category: 'Events & Actions',
    description: 'Toggle share availability scheduling mode',
    keysMac: ['S'],
    keysWin: ['S'],
  },
  {
    id: 'export-calendar',
    category: 'Events & Actions',
    description: 'Open calendar export (.ics) modal',
    keysMac: ['⌘', 'E'],
    keysWin: ['Ctrl', 'E'],
  },

  // Panels & Layout
  {
    id: 'command-menu',
    category: 'Panels & Layout',
    description: 'Open command search menu',
    keysMac: ['⌘', 'K'],
    keysWin: ['Ctrl', 'K'],
  },
  {
    id: 'settings',
    category: 'Panels & Layout',
    description: 'Open settings modal',
    keysMac: ['⌘', ','],
    keysWin: ['Ctrl', ','],
  },
  {
    id: 'toggle-left',
    category: 'Panels & Layout',
    description: 'Toggle left sidebar calendar drawer',
    keysMac: ['['],
    keysWin: ['['],
  },
  {
    id: 'toggle-right',
    category: 'Panels & Layout',
    description: 'Toggle right context inspector panel',
    keysMac: [']'],
    keysWin: [']'],
  },
  {
    id: 'shortcuts-help',
    category: 'Panels & Layout',
    description: 'Open this keyboard shortcuts help modal',
    keysMac: ['?'],
    keysWin: ['?'],
  },
  {
    id: 'escape',
    category: 'Panels & Layout',
    description: 'Close open dialogs or clear selection',
    keysMac: ['Esc'],
    keysWin: ['Esc'],
  },

  // Calendars
  {
    id: 'toggle-cultural',
    category: 'Calendars',
    description: 'Show / hide all cultural & holiday overlays',
    keysMac: ['H'],
    keysWin: ['H'],
  },
  {
    id: 'toggle-gujarati',
    category: 'Calendars',
    description: 'Toggle Gujarati Calendar & Tithis layer',
    keysMac: ['G'],
    keysWin: ['G'],
  },
];

interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  open,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [osMode, setOsMode] = useState<'mac' | 'win'>(() => {
    if (typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return 'mac';
    }
    return 'win';
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.keysWin.some((k) => k.toLowerCase().includes(q)) ||
        s.keysMac.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  // Group by category
  const categories = useMemo(() => {
    const map = new Map<string, ShortcutItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] max-h-[85vh] bg-white rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between shrink-0 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#1A1A1A]" />
            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">
              Keyboard Shortcuts Help
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* OS Mode Toggle */}
            <div className="flex items-center rounded-md border border-[#DCDCDC] bg-white p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setOsMode('mac')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  osMode === 'mac'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                macOS (⌘)
              </button>
              <button
                type="button"
                onClick={() => setOsMode('win')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  osMode === 'win'
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                Windows / Linux
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shortcuts modal"
              className="p-1 rounded-md hover:bg-[#F2F2F2] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-[#EFEFEF] bg-white shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts by action, key or category..."
              autoFocus
              className="w-full bg-[#FAFAFA] border border-[#DCDCDC] rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#3B9AE1] focus:bg-white"
            />
          </div>
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="flex-1 overflow-y-auto cal-scroll p-4 space-y-4">
          {categories.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-[#888888]">
              No keyboard shortcuts match &quot;{search}&quot;.
            </div>
          ) : (
            categories.map(([category, items]) => (
              <div key={category} className="space-y-1.5">
                <h3 className="text-[11.5px] font-semibold text-[#8C8C8C] uppercase tracking-wider px-1">
                  {category}
                </h3>
                <div className="border border-[#EFEFEF] rounded-lg divide-y divide-[#F2F2F2] bg-white">
                  {items.map((item) => {
                    const keys = osMode === 'mac' ? item.keysMac : item.keysWin;
                    return (
                      <div
                        key={item.id}
                        className="py-2 px-3 flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span className="text-[#333333] font-medium leading-tight">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="px-1.5 min-w-[22px] h-[22px] rounded-[4px] bg-[#F4F4F4] border border-[#D8D8D8] text-[11px] font-mono font-semibold text-[#333333] inline-flex items-center justify-center shadow-2xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#EFEFEF] bg-[#FAFAFA] flex items-center justify-between text-[11.5px] text-[#737373] shrink-0">
          <span>Shortcuts disabled while typing in text inputs</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#EFEFEF] border border-[#D8D8D8] text-[10.5px] font-mono text-[#4A4A4A]">
            Esc to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
