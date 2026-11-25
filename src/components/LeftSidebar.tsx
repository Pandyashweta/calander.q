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
  Eye,
  EyeOff,
  Flower2,
  Globe,
  LogOut,
  PanelLeft,
  Plane,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CalendarColorKey,
  CalendarGroup,
  CalendarLayer,
  GoogleUserProfile,
  ViewMode,
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
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';
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
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  today,
  anchorDate,
  visibleDays,
  viewMode,
  groups,
  layers,
  activeCalendarId,
  gujaratiScript,
  enabledWorldCount,
  googleUser,
  googleSyncing,
  isDrawer = false,
  onSelectDate,
  onToggleLayer,
  onSetActiveCalendar,
  onToggleAllCultural,
  onToggleGujaratiScript,
  onCollapseSidebar,
  onGoogleSignIn,
  onGoogleSync,
  onGoogleLogout,
  onOpenSettings,
  enabledWorldCalendars = [],
  onToggleWorldCalendar,
  onAddCustomCalendar,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved =
        localStorage.getItem('calendar_q_collapsed_groups') ||
        localStorage.getItem('calander_q_collapsed_groups') ||
        localStorage.getItem('samay_collapsed_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customCalName, setCustomCalName] = useState('');
  const [customCalColor, setCustomCalColor] = useState<CalendarColorKey>('blue');

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('calendar_q_collapsed_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
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

  const culturalLayers = useMemo(
    () => layers.filter((l) => l.type === 'cultural'),
    [layers]
  );
  const anyCulturalVisible = culturalLayers.some((l) => l.visible);

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
    if (icon === 'check')
      return <CheckCircle2 className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'calendar')
      return <Calendar className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'cake') return <Cake className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'flower')
      return <Flower2 className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    if (icon === 'briefcase')
      return <Briefcase className="w-3.5 h-3.5 text-[#525252] shrink-0" />;
    return null;
  };

  return (
    <aside
      className={
        isDrawer
          ? 'fixed inset-y-0 left-0 z-50 w-[min(86vw,272px)] h-full bg-[#FBFBFB] border-r border-[#EBEBEB] shadow-2xl flex flex-col select-none'
          : 'w-[244px] shrink-0 h-full bg-[#FBFBFB] border-r border-[#EBEBEB] flex flex-col select-none'
      }
    >
      {/* Top Window Chrome & Sidebar Toggle */}
      <div className="h-[44px] px-3.5 flex items-center justify-between shrink-0">
        {isDrawer ? (
          <span className="text-[13.5px] font-semibold text-[#1A1A1A] tracking-tight">
            calendar.q
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[7px] mr-1.5" aria-hidden="true">
              <span className="w-[11px] h-[11px] rounded-full bg-[#FF5F57] border border-black/10" />
              <span className="w-[11px] h-[11px] rounded-full bg-[#FEBC2E] border border-black/10" />
              <span className="w-[11px] h-[11px] rounded-full bg-[#28C840] border border-black/10" />
            </div>
            <button
              type="button"
              onClick={onCollapseSidebar}
              title="Collapse sidebar ([)"
              aria-label="Collapse sidebar"
              className="p-1 rounded-md text-[#787878] hover:text-[#1F1F1F] hover:bg-[#EFEFEF] transition-colors cursor-pointer"
            >
              <PanelLeft className="w-[15px] h-[15px]" strokeWidth={1.75} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenSettings('festivals')}
            title="Settings & World Calendars"
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
      <div className="px-3.5 pt-1 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[12px] font-medium text-[#6B6B6B] tracking-tight">
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
                      ? 'bg-[#F04422] text-white font-semibold shadow-xs'
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

      {/* Scrollable Google Calendar, Cultural Layers, World Calendars & Local Categories */}
      <div className="flex-1 overflow-y-auto cal-scroll border-t border-[#EBEBEB]">
        {/* ================= SECTION 1: GOOGLE CALENDAR ================= */}
        {groups.filter((g) => g.isGoogleGroup).map((group, groupIdx) => {
          const groupLayers = layers.filter((l) => l.groupId === group.id);
          const isCollapsed = Boolean(collapsedGroups[group.id]);

          return (
            <div
              key={group.id}
              className={`px-3.5 py-3 ${groupIdx > 0 ? 'border-t border-[#EFEFEF]' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
                  title={isCollapsed ? 'Expand Google Calendars' : 'Collapse Google Calendars'}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                  <span className="text-[11.5px] font-semibold text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-colors truncate">
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
                <div className="transition-all duration-200">
                  {!googleUser ? (
                    <div className="space-y-1.5">
                      <GoogleSignInButton
                        onClick={onGoogleSignIn}
                        disabled={googleSyncing}
                        compact
                      />
                      <p className="text-[11px] text-[#8C8C8C] leading-snug">
                        Sync events, birthdays, memorials &amp; workspace plans.
                      </p>
                    </div>
                  ) : groupLayers.length === 0 ? (
                    <div className="text-[11.5px] text-[#8C8C8C] py-1">
                      {googleSyncing ? 'Loading calendars...' : 'No calendars found.'}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {groupLayers.map((layer) => {
                        const theme = COLOR_THEMES[layer.color];
                        const dotColor = layer.customHex || theme.dot;
                        const isActive = activeCalendarId === layer.id;

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
                                  backgroundColor: layer.visible ? dotColor : 'transparent',
                                  border: layer.visible
                                    ? `1px solid ${dotColor}`
                                    : `1.5px solid ${dotColor}`,
                                  boxShadow: isActive
                                    ? `0 0 0 2px #FBFBFB, 0 0 0 3.5px ${dotColor}`
                                    : undefined,
                                }}
                              >
                                {layer.visible && (
                                  <Check
                                    className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    strokeWidth={3}
                                  />
                                )}
                              </span>
                              <span
                                className={`text-[12.5px] truncate transition-colors ${
                                  layer.visible
                                    ? 'text-[#1F1F1F] font-medium'
                                    : 'text-[#9A9A9A] font-normal'
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
              )}
            </div>
          );
        })}

        {/* ================= SECTION 2: MY CALENDARS (LOCAL + CUSTOM) ================= */}
        {groups.filter((g) => g.id === 'local-calendars').map((group) => {
          const groupLayers = layers.filter(
            (l) => l.groupId === group.id || l.type === 'personal' || l.type === 'custom'
          );
          const isCollapsed = Boolean(collapsedGroups[group.id]);

          return (
            <div
              key={group.id}
              className="px-3.5 py-3 border-t border-[#EFEFEF]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
                  title={isCollapsed ? 'Expand My Calendars' : 'Collapse My Calendars'}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                  <span className="text-[11.5px] font-semibold text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                    {group.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCustom((v) => !v)}
                  title="Add custom personal calendar"
                  aria-label="Add custom personal calendar"
                  className="p-1 rounded text-[#7A7A7A] hover:text-[#1A1A1A] hover:bg-[#ECECEC] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Custom Calendar Creator */}
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

              {!isCollapsed && (
                <div className="space-y-0.5 transition-all duration-200">
                  {groupLayers.map((layer) => {
                    const theme = COLOR_THEMES[layer.color] || COLOR_THEMES.blue;
                    const isActivePersonal =
                      (layer.type === 'personal' || layer.type === 'custom') &&
                      activeCalendarId === layer.id;

                    return (
                      <div
                        key={layer.id}
                        className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onToggleLayer(layer.id);
                            if (
                              (layer.type === 'personal' || layer.type === 'custom') &&
                              !layer.visible
                            ) {
                              onSetActiveCalendar(layer.id);
                            }
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
                              boxShadow: isActivePersonal
                                ? `0 0 0 2px #FBFBFB, 0 0 0 3.5px ${theme.dot}`
                                : undefined,
                            }}
                          >
                            {layer.visible && (
                              <Check
                                className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                strokeWidth={3}
                              />
                            )}
                          </span>

                          {renderLayerIcon(layer.icon)}

                          <span
                            className={`text-[12.5px] truncate transition-colors ${
                              layer.visible
                                ? 'text-[#1F1F1F] font-medium'
                                : 'text-[#9A9A9A] font-normal'
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
          );
        })}

        {/* ================= SECTION 3: WORLD & MULTI-CALENDARS ================= */}
        <div className="px-3.5 py-3 border-t border-[#EFEFEF]">
          {(() => {
            const isCollapsed = Boolean(collapsedGroups['world-calendars']);

            return (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse('world-calendars')}
                    className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
                    title={isCollapsed ? 'Expand World Calendars' : 'Collapse World Calendars'}
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                    <span className="text-[11.5px] font-semibold text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                      World Calendars
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10.5px] font-medium text-[#737373] bg-[#F0F0F0] px-1.5 py-0.5 rounded tabular-nums">
                      {enabledWorldCount} active
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenSettings('world')}
                      title="Configure all 32 world calendar systems in Settings"
                      aria-label="Configure World Calendars"
                      className="p-1 rounded text-[#7A7A7A] hover:text-[#1A1A1A] hover:bg-[#ECECEC] transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-0.5 transition-all duration-200">
                    {WORLD_CALENDAR_SYSTEMS.map((sys) => {
                      const isEnabled = enabledWorldSet.has(sys.id);
                      const dotColor =
                        sys.id === 'gujarati-vikram'
                          ? '#DBA314'
                          : sys.id === 'islamic-hijri'
                          ? '#34B36E'
                          : sys.id === 'hebrew'
                          ? '#3B9AE1'
                          : sys.id === 'chinese'
                          ? '#E12D39'
                          : sys.id === 'solar-hijri'
                          ? '#F0753C'
                          : sys.id === 'buddhist'
                          ? '#E6B422'
                          : sys.id === 'japanese'
                          ? '#9B51E0'
                          : sys.id === 'ethiopian'
                          ? '#E86A17'
                          : sys.id === 'coptic'
                          ? '#0D9488'
                          : sys.id === 'iso-week'
                          ? '#5C6BC0'
                          : sys.id === 'academic'
                          ? '#DF5A49'
                          : sys.id === 'fiscal'
                          ? '#757575'
                          : '#8C8C8C';

                      return (
                        <div
                          key={sys.id}
                          className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => onToggleWorldCalendar && onToggleWorldCalendar(sys.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <span
                              className="w-[13px] h-[13px] rounded-[3.5px] flex items-center justify-center shrink-0 transition-all"
                              style={{
                                backgroundColor: isEnabled ? dotColor : 'transparent',
                                border: isEnabled
                                  ? `1px solid ${dotColor}`
                                  : `1.5px solid ${dotColor}`,
                              }}
                            >
                              {isEnabled && (
                                <Check
                                  className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  strokeWidth={3}
                                />
                              )}
                            </span>

                            <span
                              className={`text-[12.5px] truncate transition-colors ${
                                isEnabled
                                  ? 'text-[#1F1F1F] font-medium'
                                  : 'text-[#9A9A9A] font-normal'
                              }`}
                            >
                              {sys.name}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* ================= SECTION 4: FESTIVALS & CULTURAL HOLIDAYS ================= */}
        {groups.filter((g) => g.isCulturalGroup).map((group) => {
          const groupLayers = layers.filter((l) => l.groupId === group.id);
          const isCollapsed = Boolean(collapsedGroups[group.id]);

          return (
            <div
              key={group.id}
              className="px-3.5 py-3 border-t border-[#EFEFEF]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-1.5 min-w-0 text-left hover:text-[#1A1A1A] cursor-pointer group/title"
                  title={isCollapsed ? 'Expand Festivals & Holidays' : 'Collapse Festivals & Holidays'}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-transform duration-200 shrink-0 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                  <span className="text-[11.5px] font-semibold text-[#8C8C8C] group-hover/title:text-[#1A1A1A] transition-colors truncate">
                    {group.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onToggleAllCultural}
                  title={
                    anyCulturalVisible
                      ? 'Hide all festivals, holidays & Gujarati calendar (H)'
                      : 'Show all festivals, holidays & Gujarati calendar (H)'
                  }
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#ECECEC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {anyCulturalVisible ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide all</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Show all</span>
                    </>
                  )}
                </button>
              </div>

              {!isCollapsed && (
                <div className="space-y-0.5 transition-all duration-200">
                  {groupLayers.map((layer) => {
                    const theme = COLOR_THEMES[layer.color];

                    return (
                      <div
                        key={layer.id}
                        className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onToggleLayer(layer.id);
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
                            }}
                          >
                            {layer.visible && (
                              <Check
                                className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                strokeWidth={3}
                              />
                            )}
                          </span>

                          {renderLayerIcon(layer.icon)}

                          <span
                            className={`text-[12.5px] truncate transition-colors ${
                              layer.visible
                                ? 'text-[#1F1F1F] font-medium'
                                : 'text-[#9A9A9A] font-normal'
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
                            title="Switch Gujarati Calendar labels between English & ગુજરાતી script"
                            className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border transition-colors shrink-0 cursor-pointer ${
                              gujaratiScript
                                ? 'bg-[#FEF5D9] border-[#E5C16C] text-[#7A4C00] font-gujarati'
                                : 'bg-white border-[#E2E2E2] text-[#666666] hover:text-[#1A1A1A]'
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
            </div>
          );
        })}
      </div>

      {/* Bottom Settings & World Calendars Entry */}
      <div className="px-3.5 py-2.5 border-t border-[#EBEBEB] shrink-0">
        <button
          type="button"
          onClick={() => onOpenSettings('world')}
          className="w-full py-1.5 px-2.5 rounded-md bg-white border border-[#E4E4E4] hover:bg-[#F3F3F3] text-[12px] font-medium text-[#3F3F3F] flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 truncate">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#737373] shrink-0" />
            <span className="truncate">Settings &amp; World Calendars</span>
          </span>
          <span className="text-[11px] text-[#7A7A7A] tabular-nums shrink-0">
            {enabledWorldCount}/29
          </span>
        </button>
      </div>
    </aside>
  );
};
