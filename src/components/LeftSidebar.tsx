import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Cake,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Flower2,
  LogOut,
  PanelLeft,
  Plane,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CalendarGroup,
  CalendarLayer,
  GoogleUserProfile,
  ViewMode,
} from '../types/calendar';
import {
  COLOR_THEMES,
  DAY_NAMES_MINI,
  MONTH_NAMES,
  formatDateKey,
  getMonthGrid,
  isSameDay,
} from '../utils/dateUtils';
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
}) => {
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
            Samay Calendar
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

      {/* Scrollable Google Calendar, Cultural Layers & Local Categories */}
      <div className="flex-1 overflow-y-auto cal-scroll border-t border-[#EBEBEB]">
        {groups.map((group, groupIdx) => {
          const groupLayers = layers.filter((l) => l.groupId === group.id);

          // Google Calendar Connect / Connected Section
          if (group.isGoogleGroup) {
            return (
              <div
                key={group.id}
                className={`px-3.5 py-3 ${groupIdx > 0 ? 'border-t border-[#EFEFEF]' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11.5px] font-medium text-[#8C8C8C] truncate">
                    {googleUser?.email || group.label}
                  </span>
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
            );
          }

          if (groupLayers.length === 0) return null;

          return (
            <div
              key={group.id}
              className={`px-3.5 py-3 ${
                groupIdx > 0 ? 'border-t border-[#EFEFEF]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11.5px] font-medium text-[#8C8C8C] truncate">
                  {group.label}
                </span>

                {group.isCulturalGroup && (
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
                )}
              </div>

              <div className="space-y-0.5">
                {groupLayers.map((layer) => {
                  const theme = COLOR_THEMES[layer.color];
                  const isActivePersonal =
                    layer.type === 'personal' && activeCalendarId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      className="group flex items-center justify-between gap-1.5 py-[4.5px] px-1 -mx-1 rounded-md hover:bg-[#F0F0F0] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onToggleLayer(layer.id);
                          if (layer.type === 'personal' && !layer.visible) {
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
