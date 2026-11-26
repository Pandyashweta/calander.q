import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Cake,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Flower2,
  LogOut,
  PanelLeft,
  Plane,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CalendarColorKey,
  CalendarGroup,
  CalendarLayer,
  GoogleUserProfile,
  ViewMode,
  WorldCalendarGroupId,
  WorldCalendarSystemId,
} from '../types/calendar';
import {
  COLOR_THEMES,
  DAY_NAMES_MINI,
  MONTH_NAMES,
  formatDateKey,
  getMonthGrid,
  isSameDay,
} from '../utils/dateUtils';
import { WORLD_CALENDAR_GROUPS, WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';
import { HolidayRegionCode, getRegionLabel } from '../utils/deviceUtils';
import { GoogleSignInButton, SettingsTab } from './SettingsModal';

interface LeftSidebarProps {
  today: Date;
  anchorDate: Date;
  visibleDays: Date[];
  viewMode: ViewMode;
  groups: CalendarGroup[];
  layers: CalendarLayer[];
  activeCalendarId: string;
  gujaratiScript: boolean;
  holidayRegion: HolidayRegionCode;
  enabledWorldCount: number;
  enabledWorldCalendars?: WorldCalendarSystemId[];
  onToggleWorldCalendar?: (id: WorldCalendarSystemId) => void;
  onAddCustomCalendar?: (name: string, color: CalendarColorKey) => void;
  googleUser: GoogleUserProfile | null;
  googleSyncing: boolean;
  isDrawer?: boolean;
  onSelectDate: (date: Date) => void;
  onToggleLayer: (layerId: string) => void;
  onSetActiveCalendar: (layerId: string) => void;
  onToggleAllCultural: () => void;
  onToggleGujaratiScript: () => void;
  onCollapseSidebar: () => void;
  onGoogleSignIn: () => void;
  onGoogleSync: () => void;
  onGoogleLogout: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenDownloadHub?: () => void;
}

const WORLD_CATEGORY_COLORS: Record<WorldCalendarGroupId, string> = {
  indian: '#DBA314',
  religious: '#34B36E',
  asian: '#E12D39',
  historical: '#5C6BC0',
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  today,
  anchorDate,
  visibleDays,
  viewMode,
  groups,
  layers,
  activeCalendarId,
  gujaratiScript,
  holidayRegion,
  enabledWorldCount,
  googleUser,
  googleSyncing,
  isDrawer = false,
  onSelectDate,
  onToggleLayer,
  onSetActiveCalendar,
  onToggleGujaratiScript,
  onCollapseSidebar,
  onGoogleSignIn,
  onGoogleSync,
  onGoogleLogout,
  onOpenSettings,
  onOpenDownloadHub,
  enabledWorldCalendars = [],
  onToggleWorldCalendar,
  onAddCustomCalendar,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('calendar_q_collapsed_groups_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Keep World Calendars collapsed by default for a clean, scannable sidebar
    return { 'world-calendars': true };
  });

  const [expandedWorldCategories, setExpandedWorldCategories] = useState<
    Record<WorldCalendarGroupId, boolean>
  >({
    indian: false,
    religious: false,
    asian: false,
    historical: false,
  });

  const [worldSearch, setWorldSearch] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customCalName, setCustomCalName] = useState('');
  const [customCalColor, setCustomCalColor] = useState<CalendarColorKey>('blue');

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('calendar_q_collapsed_groups_v3', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleWorldCategory = (catId: WorldCalendarGroupId) => {
    setExpandedWorldCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const enabledWorldSet = useMemo(
    () => new Set(enabledWorldCalendars),
    [enabledWorldCalendars]
  );

  const [miniMonthOffset, setMiniMonthOffset] = useState<{ year: number; month: number }>(
    () => ({
      year: anchorDate.getFullYear(),
      month: anchorDate.getMonth(),
    })
  );

  React.useEffect(() => {
    setMiniMonthOffset({
      year: anchorDate.getFullYear(),
      month: anchorDate.getMonth(),
    });
  }, [anchorDate.getFullYear(), anchorDate.getMonth()]);

  const miniDays = useMemo(
    () => getMonthGrid(miniMonthOffset.year, miniMonthOffset.month),
    [miniMonthOffset.year, miniMonthOffset.month]
  );

  const visibleKeySet = useMemo(() => {
    if (viewMode === 'month') return new Set<string>([formatDateKey(anchorDate)]);
    return new Set<string>(visibleDays.map(formatDateKey));
  }, [visibleDays, viewMode, anchorDate]);

  // Strictly ONLY Holidays & Indian Festivals in the Holidays & Festivals section
  const holidayAndIndianLayers = useMemo(
    () =>
      layers.filter(
        (l) => l.id === 'national-holidays' || l.id === 'indian-festivals'
      ),
    [layers]
  );

  // Gujarati Calendar & Tithis, World Calendar Festivals, and International Days live under World Calendars
  const worldOverlayLayers = useMemo(
    () =>
      layers.filter(
        (l) =>
          l.id === 'gujarati-calendar' ||
          l.id === 'world-observances' ||
          l.id === 'global-days'
      ),
    [layers]
  );

  const localLayers = useMemo(
    () => layers.filter((l) => l.type === 'personal' || l.type === 'custom'),
    [layers]
  );

  const googleLayers = useMemo(
    () => layers.filter((l) => l.type === 'google'),
    [layers]
  );

  const activeWorldOverlayCount = worldOverlayLayers.filter((l) => l.visible).length;
  const totalActiveWorld = enabledWorldCount + activeWorldOverlayCount;

  const handleMiniPrev = () => {
    setMiniMonthOffset((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleMiniNext = () => {
    setMiniMonthOffset((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const renderLayerIcon = (icon?: CalendarLayer['icon']) => {
    if (icon === 'plane') return <Plane className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'check') return <CheckCircle2 className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'calendar') return <Calendar className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'cake') return <Cake className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'flower') return <Flower2 className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'briefcase') return <Briefcase className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    return null;
  };

  const cleanSearch = worldSearch.trim().toLowerCase();

  return (
    <aside
      className={
        isDrawer
          ? 'fixed inset-y-0 left-0 z-50 w-[min(86vw,272px)] h-full bg-[#FBFBFB] border-r border-[#EBEBEB] shadow-2xl flex flex-col select-none'
          : 'w-[248px] shrink-0 h-full bg-[#FBFBFB] border-r border-[#EBEBEB] flex flex-col select-none'
      }
    >
      {/* Top Window Chrome & Sidebar Toggle */}
      <div className="h-[44px] px-3.5 flex items-center justify-between shrink-0">
        {isDrawer ? (
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="w-4 h-4 rounded-[4px]" />
            <span className="text-[13.5px] font-semibold text-[#1A1A1A] tracking-tight">
              calendar<span className="text-[#DC2626]">.q</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="w-[18px] h-[18px] rounded-[4px]" />
            <span className="text-[13.5px] font-semibold text-[#1A1A1A] tracking-tight">
              calendar<span className="text-[#DC2626]">.q</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {!isDrawer && (
            <button
              type="button"
              onClick={onCollapseSidebar}
              title="Collapse sidebar ([)"
              aria-label="Collapse sidebar"
              className="p-1 rounded-md text-[#787878] hover:text-[#1F1F1F] hover:bg-[#EFEFEF] transition-colors cursor-pointer"
            >
              <PanelLeft className="w-[15px] h-[15px]" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenSettings('festivals')}
            title="Calendar Settings"
            aria-label="Open calendar settings"
            className="p-1.5 rounded-md text-[#787878] hover:text-[#1F1F1F] hover:bg-[#EFEFEF] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-[14px] h-[14px]" />
          </button>
          {isDrawer && (
            <button
              type="button"
              onClick={onCollapseSidebar}
              aria-label="Close sidebar"
              className="p-1.5 rounded-md text-[#787878] hover:text-[#1F1F1F] hover:bg-[#EFEFEF] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="px-3.5 pt-1 pb-3.5 shrink-0">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[12px] font-medium text-[#525252] tracking-tight">
            {MONTH_NAMES[miniMonthOffset.month]} {miniMonthOffset.year}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleMiniPrev}
              aria-label="Previous month"
              className="p-1 rounded hover:bg-[#ECECEC] text-[#7A7A7A] hover:text-[#1F1F1F] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMiniNext}
              aria-label="Next month"
              className="p-1 rounded hover:bg-[#ECECEC] text-[#7A7A7A] hover:text-[#1F1F1F] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES_MINI.map((d) => (
            <div
              key={d}
              className="text-center text-[10.5px] font-medium text-[#8E8E8E] py-0.5"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-[2px]">
          {miniDays.map((day, idx) => {
            const key = formatDateKey(day);
            const isCurrentMonth = day.getMonth() === miniMonthOffset.month;
            const isToday = isSameDay(day, today);
            const inRange = visibleKeySet.has(key);

            const col = idx % 7;
            const prevInRange =
              col > 0 && visibleKeySet.has(formatDateKey(miniDays[idx - 1]));
            const nextInRange =
              col < 6 && visibleKeySet.has(formatDateKey(miniDays[idx + 1]));

            let rangeBgClass = '';
            if (inRange) {
              if (!prevInRange && !nextInRange) rangeBgClass = 'bg-[#EAEAEA] rounded-[6px]';
              else if (!prevInRange && nextInRange) rangeBgClass = 'bg-[#EAEAEA] rounded-l-[6px]';
              else if (prevInRange && !nextInRange) rangeBgClass = 'bg-[#EAEAEA] rounded-r-[6px]';
              else rangeBgClass = 'bg-[#EAEAEA]';
            }

            return (
              <div
                key={key}
                className={`flex items-center justify-center h-[26px] ${rangeBgClass}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={`w-[24px] h-[24px] flex items-center justify-center text-[11.5px] tabular-nums rounded-[6px] transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-[#DC2626] text-white font-semibold shadow-xs'
                      : isCurrentMonth
                      ? 'text-[#1F1F1F] hover:bg-[#E2E2E2] font-medium'
                      : 'text-[#BDBDBD] hover:bg-[#EFEFEF]'
                  }`}
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Organized Calendar Sections */}
      <div className="flex-1 overflow-y-auto cal-scroll border-t border-[#EBEBEB]">
        {/* ================= SECTION 1: HOLIDAYS & FESTIVALS (ONLY HOLIDAYS + INDIAN FESTIVALS) ================= */}
        <div className="px-3.5 py-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => toggleGroupCollapse('cultural-festivals')}
              className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
              aria-expanded={!collapsedGroups['cultural-festivals']}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                  collapsedGroups['cultural-festivals'] ? '-rotate-90' : 'rotate-0'
                }`}
              />
              <span className="text-[11.5px] font-semibold text-[#6B6B6B] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                Holidays &amp; Festivals
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSettings('festivals')}
              title="Change holiday region in Settings"
              className="text-[10.5px] font-medium text-[#737373] hover:text-[#1A1A1A] cursor-pointer truncate max-w-[82px]"
            >
              {getRegionLabel(holidayRegion)}
            </button>
          </div>

          {!collapsedGroups['cultural-festivals'] && (
            <div className="space-y-0.5">
              {holidayAndIndianLayers.map((layer) => {
                const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.crimson;
                const displayName =
                  layer.id === 'national-holidays'
                    ? `Holidays (${getRegionLabel(holidayRegion)})`
                    : layer.name;
                return (
                  <div
                    key={layer.id}
                    className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleLayer(layer.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className="w-[13px] h-[13px] rounded-[3.5px] flex items-center justify-center shrink-0 transition-all"
                        style={{
                          backgroundColor: layer.visible ? theme.dot : 'transparent',
                          border: layer.visible
                            ? `1px solid ${theme.dot}`
                            : `1.5px solid ${theme.dot}`,
                        }}
                      >
                        {layer.visible && (
                          <Check
                            className="w-2.5 h-2.5 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </span>
                      <span
                        className={`text-[12.5px] truncate transition-colors ${
                          layer.visible
                            ? 'text-[#1F1F1F] font-medium'
                            : 'text-[#8C8C8C] font-normal'
                        }`}
                      >
                        {displayName}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= SECTION 2: MY CALENDARS (LOCAL) ================= */}
        <div className="px-3.5 py-3 border-t border-[#EFEFEF]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => toggleGroupCollapse('local-calendars')}
              className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
              aria-expanded={!collapsedGroups['local-calendars']}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                  collapsedGroups['local-calendars'] ? '-rotate-90' : 'rotate-0'
                }`}
              />
              <span className="text-[11.5px] font-semibold text-[#6B6B6B] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                My Calendars
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddCustom((v) => !v)}
              title="Add custom local calendar"
              aria-label="Add custom local calendar"
              className="p-1 rounded text-[#7A7A7A] hover:text-[#1A1A1A] hover:bg-[#ECECEC] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showAddCustom && (
            <div className="mb-2.5 p-2 rounded-lg bg-white border border-[#E2E2E2] shadow-xs space-y-2">
              <input
                type="text"
                value={customCalName}
                onChange={(e) => setCustomCalName(e.target.value)}
                placeholder="New calendar name..."
                autoFocus
                className="w-full bg-[#FAFAFA] border border-[#DCDCDC] rounded px-2 py-1 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#3B9AE1]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCalName.trim() && onAddCustomCalendar) {
                    onAddCustomCalendar(customCalName.trim(), customCalColor);
                    setCustomCalName('');
                    setShowAddCustom(false);
                  } else if (e.key === 'Escape') {
                    setShowAddCustom(false);
                  }
                }}
              />
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {(['blue', 'purple', 'green', 'amber', 'coral', 'teal'] as CalendarColorKey[]).map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCustomCalColor(col)}
                        className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                          customCalColor === col ? 'scale-125 ring-2 ring-offset-1 ring-[#1A1A1A]' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: COLOR_THEMES[col].dot }}
                      />
                    )
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-2 py-0.5 text-[11px] text-[#737373] hover:text-[#1A1A1A] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!customCalName.trim()}
                    onClick={() => {
                      if (customCalName.trim() && onAddCustomCalendar) {
                        onAddCustomCalendar(customCalName.trim(), customCalColor);
                        setCustomCalName('');
                        setShowAddCustom(false);
                      }
                    }}
                    className="px-2.5 py-0.5 bg-[#1A1A1A] text-white rounded text-[11px] font-medium hover:bg-[#333333] disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {!collapsedGroups['local-calendars'] && (
            <div className="space-y-0.5">
              {localLayers.map((layer) => {
                const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.blue;
                const isActivePersonal = activeCalendarId === layer.id;

                return (
                  <div
                    key={layer.id}
                    className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onToggleLayer(layer.id);
                        if (!layer.visible) onSetActiveCalendar(layer.id);
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className="w-[13px] h-[13px] rounded-[3.5px] flex items-center justify-center shrink-0 transition-all"
                        style={{
                          backgroundColor: layer.visible ? theme.dot : 'transparent',
                          border: layer.visible
                            ? `1px solid ${theme.dot}`
                            : `1.5px solid ${theme.dot}`,
                          boxShadow:
                            isActivePersonal && layer.visible
                              ? `0 0 0 2px #FBFBFB, 0 0 0 3.5px ${theme.dot}`
                              : undefined,
                        }}
                      >
                        {layer.visible && (
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        )}
                      </span>
                      {renderLayerIcon(layer.icon)}
                      <span
                        className={`text-[12.5px] truncate transition-colors ${
                          layer.visible
                            ? 'text-[#1F1F1F] font-medium'
                            : 'text-[#8C8C8C] font-normal'
                        }`}
                      >
                        {layer.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= SECTION 3: ORGANIZED WORLD CALENDARS (INC. GUJARATI TITHIS & WORLD FESTIVALS) ================= */}
        <div className="px-3.5 py-3 border-t border-[#EFEFEF]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => toggleGroupCollapse('world-calendars')}
              className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
              aria-expanded={!collapsedGroups['world-calendars']}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                  collapsedGroups['world-calendars'] ? '-rotate-90' : 'rotate-0'
                }`}
              />
              <span className="text-[11.5px] font-semibold text-[#6B6B6B] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                World Calendars
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10.5px] font-medium text-[#737373] tabular-nums">
                {totalActiveWorld > 0 ? `${totalActiveWorld} on` : `${WORLD_CALENDAR_SYSTEMS.length}`}
              </span>
              <button
                type="button"
                onClick={() => onOpenSettings('world')}
                title="Manage World Calendars in Settings"
                aria-label="Configure World Calendars"
                className="p-1 rounded text-[#7A7A7A] hover:text-[#1A1A1A] hover:bg-[#ECECEC] transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!collapsedGroups['world-calendars'] && (
            <div className="space-y-2.5">
              {/* Quick search inside World Calendars */}
              <div className="relative">
                <Search className="w-3 h-3 text-[#9A9A9A] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={worldSearch}
                  onChange={(e) => setWorldSearch(e.target.value)}
                  placeholder="Filter calendars..."
                  className="w-full bg-white border border-[#E4E4E4] rounded-md pl-6 pr-2 py-1 text-[11.5px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                />
              </div>

              {/* World Calendar Event & Tithi Overlays (Gujarati Calendar & Tithis, World Festivals, International Days) */}
              {(!cleanSearch ||
                worldOverlayLayers.some((l) => l.name.toLowerCase().includes(cleanSearch))) && (
                <div className="space-y-0.5 pb-2 border-b border-[#EFEFEF]">
                  <div className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-wider px-1 mb-1">
                    Festivals &amp; Tithis
                  </div>
                  {worldOverlayLayers
                    .filter((l) => !cleanSearch || l.name.toLowerCase().includes(cleanSearch))
                    .map((layer) => {
                      const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.teal;
                      return (
                        <div
                          key={layer.id}
                          className="group flex items-center justify-between gap-1.5 py-[4px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => onToggleLayer(layer.id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <span
                              className="w-[12px] h-[12px] rounded-[3px] flex items-center justify-center shrink-0 transition-all"
                              style={{
                                backgroundColor: layer.visible ? theme.dot : 'transparent',
                                border: layer.visible
                                  ? `1px solid ${theme.dot}`
                                  : `1.5px solid ${theme.dot}`,
                              }}
                            >
                              {layer.visible && (
                                <Check className="w-2 h-2 text-white" strokeWidth={3} />
                              )}
                            </span>
                            <span
                              className={`text-[12px] truncate ${
                                layer.visible
                                  ? 'text-[#1F1F1F] font-medium'
                                  : 'text-[#8C8C8C]'
                              }`}
                            >
                              {layer.name}
                            </span>
                          </button>

                          {layer.id === 'gujarati-calendar' && layer.visible && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleGujaratiScript();
                              }}
                              title="Switch Gujarati labels between English & ગુજરાતી"
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer shrink-0 ${
                                gujaratiScript
                                  ? 'bg-[#FEF5D9] border-[#E5C16C] text-[#7A4C00] font-gujarati'
                                  : 'bg-white border-[#E2E2E2] text-[#666666]'
                              }`}
                            >
                              {gujaratiScript ? 'ગુજ' : 'En'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Organized Collapsible World Calendar Category Sub-Groups */}
              <div className="space-y-1">
                {WORLD_CALENDAR_GROUPS.map((grp) => {
                  const groupSystems = WORLD_CALENDAR_SYSTEMS.filter(
                    (s) =>
                      s.group === grp.id &&
                      (!cleanSearch ||
                        s.name.toLowerCase().includes(cleanSearch) ||
                        s.region.toLowerCase().includes(cleanSearch))
                  );
                  if (groupSystems.length === 0) return null;

                  const activeInGroup = groupSystems.filter((s) =>
                    enabledWorldSet.has(s.id)
                  ).length;
                  const isOpen = cleanSearch.length > 0 || expandedWorldCategories[grp.id];
                  const dotColor = WORLD_CATEGORY_COLORS[grp.id] || '#737373';

                  return (
                    <div key={grp.id}>
                      <button
                        type="button"
                        onClick={() => toggleWorldCategory(grp.id)}
                        className="w-full flex items-center justify-between gap-1.5 py-1 px-1 -mx-1 rounded hover:bg-[#EFEFEF] text-left cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <ChevronRight
                            className={`w-3 h-3 text-[#8C8C8C] transition-transform shrink-0 ${
                              isOpen ? 'rotate-90' : 'rotate-0'
                            }`}
                          />
                          <span className="text-[11.5px] font-medium text-[#525252] truncate">
                            {grp.label}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#9A9A9A] tabular-nums shrink-0">
                          {activeInGroup > 0
                            ? `${activeInGroup}/${groupSystems.length}`
                            : groupSystems.length}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#ECECEC] ml-1.5">
                          {groupSystems.map((sys) => {
                            const isEnabled = enabledWorldSet.has(sys.id);
                            return (
                              <button
                                key={sys.id}
                                type="button"
                                onClick={() => onToggleWorldCalendar?.(sys.id)}
                                className="w-full flex items-center gap-2 py-[3.5px] px-1 rounded hover:bg-[#F0F0F0] text-left cursor-pointer"
                              >
                                <span
                                  className="w-[12px] h-[12px] rounded-[3px] flex items-center justify-center shrink-0 transition-all"
                                  style={{
                                    backgroundColor: isEnabled ? dotColor : 'transparent',
                                    border: isEnabled
                                      ? `1px solid ${dotColor}`
                                      : `1.5px solid ${dotColor}`,
                                  }}
                                >
                                  {isEnabled && (
                                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                                  )}
                                </span>
                                <span
                                  className={`text-[12px] truncate ${
                                    isEnabled
                                      ? 'text-[#1F1F1F] font-medium'
                                      : 'text-[#8C8C8C]'
                                  }`}
                                >
                                  {sys.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION 4: GOOGLE CALENDAR ================= */}
        {groups
          .filter((g) => g.isGoogleGroup)
          .map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div key={group.id} className="px-3.5 py-3 border-t border-[#EFEFEF]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                    <span className="text-[11.5px] font-semibold text-[#6B6B6B] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                      {googleUser?.email || group.label}
                    </span>
                  </button>

                  {googleUser && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={onGoogleSync}
                        disabled={googleSyncing}
                        title="Sync Google Calendar"
                        aria-label="Sync Google Calendar"
                        className="p-1 rounded hover:bg-[#ECECEC] text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${googleSyncing ? 'animate-spin' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={onGoogleLogout}
                        title="Disconnect Google Calendar"
                        aria-label="Disconnect Google Calendar"
                        className="p-1 rounded hover:bg-[#FDE2E4] text-[#7A7A7A] hover:text-[#8A1520] cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div>
                    {!googleUser ? (
                      <div className="space-y-1.5">
                        <GoogleSignInButton
                          onClick={onGoogleSignIn}
                          disabled={googleSyncing}
                          compact
                        />
                        <p className="text-[11px] text-[#8C8C8C] leading-snug">
                          Optional two-way Google Calendar sync.
                        </p>
                      </div>
                    ) : googleLayers.length === 0 ? (
                      <div className="text-[11.5px] text-[#8C8C8C] py-1">
                        {googleSyncing ? 'Loading calendars...' : 'No calendars loaded yet.'}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {googleLayers.map((layer) => {
                          const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.blue;
                          const dotColor = layer.customHex || theme.dot;
                          return (
                            <button
                              key={layer.id}
                              type="button"
                              onClick={() => {
                                onToggleLayer(layer.id);
                                if (!layer.visible) onSetActiveCalendar(layer.id);
                              }}
                              className="w-full flex items-center gap-2.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] text-left cursor-pointer"
                            >
                              <span
                                className="w-[13px] h-[13px] rounded-[3.5px] flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: layer.visible ? dotColor : 'transparent',
                                  border: layer.visible
                                    ? `1px solid ${dotColor}`
                                    : `1.5px solid ${dotColor}`,
                                }}
                              >
                                {layer.visible && (
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                )}
                              </span>
                              <span
                                className={`text-[12.5px] truncate ${
                                  layer.visible
                                    ? 'text-[#1F1F1F] font-medium'
                                    : 'text-[#8C8C8C]'
                                }`}
                              >
                                {layer.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="px-3.5 py-2.5 border-t border-[#EBEBEB] shrink-0 space-y-1.5">
        <button
          type="button"
          onClick={() => onOpenSettings('world')}
          className="w-full py-1.5 px-2.5 rounded-md bg-white border border-[#E4E4E4] hover:bg-[#F3F3F3] text-[12px] font-medium text-[#3F3F3F] flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 truncate">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#737373] shrink-0" />
            <span className="truncate">Settings</span>
          </span>
          <span className="text-[11px] text-[#7A7A7A] tabular-nums shrink-0">
            {enabledWorldCount}/{WORLD_CALENDAR_SYSTEMS.length}
          </span>
        </button>

        {onOpenDownloadHub && (
          <button
            type="button"
            onClick={onOpenDownloadHub}
            className="w-full py-1.5 px-2.5 rounded-md hover:bg-[#EFEFEF] text-[11.5px] font-medium text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Desktop &amp; Mobile Widgets</span>
          </button>
        )}
      </div>
    </aside>
  );
};
