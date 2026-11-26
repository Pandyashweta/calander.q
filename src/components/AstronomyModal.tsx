import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  Moon,
  Orbit,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import {
  ANNUAL_METEOR_SHOWERS,
  ECLIPSE_CATALOG,
  PLANETARY_EVENTS,
  getDetailedMoon,
  getSolarAlmanac,
} from '../services/astronomyService';
import { MONTH_NAMES, parseDateKey } from '../utils/dateUtils';

interface AstronomyModalProps {
  open: boolean;
  anchorDate: Date;
  locationName?: string;
  lat?: number;
  lng?: number;
  onClose: () => void;
  onJumpToDate: (date: Date) => void;
}

type AstroSection = 'overview' | 'eclipses' | 'meteors' | 'planets';

export const AstronomyModal: React.FC<AstronomyModalProps> = ({
  open,
  anchorDate,
  locationName,
  lat,
  lng,
  onClose,
  onJumpToDate,
}) => {
  const [section, setSection] = useState<AstroSection>('overview');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const moon = useMemo(() => getDetailedMoon(anchorDate), [anchorDate]);
  const solar = useMemo(
    () => getSolarAlmanac(anchorDate, lat ?? 23.0225, lng ?? 72.5714),
    [anchorDate, lat, lng]
  );

  if (!open) return null;

  const dateLabel = `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Astronomy and Celestial Almanac"
        className="w-full max-w-[780px] max-h-[86vh] bg-white border border-[#E2E2E2] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EFEFEF] flex items-center justify-between gap-3 bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Moon className="w-4 h-4 text-[#1A1A1A] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[#1A1A1A] truncate">
                Astronomy &amp; Celestial Almanac
              </h2>
              <p className="text-[11.5px] text-[#737373] truncate">
                {dateLabel}
                {locationName ? ` · ${locationName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close astronomy dialog"
            className="p-1.5 rounded-md hover:bg-[#EFEFEF] text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Section Tabs */}
        <div className="px-5 py-2 border-b border-[#EFEFEF] flex items-center gap-1 overflow-x-auto shrink-0 bg-white">
          {(
            [
              { id: 'overview', label: 'Sun & Moon', icon: Sun },
              { id: 'eclipses', label: `Eclipses (${ECLIPSE_CATALOG.length})`, icon: Orbit },
              { id: 'meteors', label: `Meteor Showers (${ANNUAL_METEOR_SHOWERS.length})`, icon: Sparkles },
              { id: 'planets', label: `Solstices & Planets (${PLANETARY_EVENTS.length})`, icon: Compass },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#666666] hover:bg-[#F3F3F3] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto cal-scroll p-5">
          {section === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Lunar Card */}
              <div className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                      Lunar Phase
                    </div>
                    <div className="text-[18px] font-bold text-[#1A1A1A] mt-0.5">
                      {moon.phaseName}
                    </div>
                    <div className="text-[12px] text-[#666666] mt-0.5 tabular-nums">
                      {moon.illuminationPercent}% illuminated · Day {moon.ageDays.toFixed(1)} of 29.5
                    </div>
                  </div>

                  {/* Crisp SVG Moon Phase Disk */}
                  <div className="w-12 h-12 rounded-full bg-[#171717] border border-[#333333] flex items-center justify-center shrink-0 overflow-hidden">
                    <div
                      className="h-full bg-[#F5F5F4] transition-all"
                      style={{
                        width: `${Math.max(8, moon.illuminationPercent)}%`,
                        marginLeft: moon.ageDays < 14.76 ? 'auto' : '0',
                        marginRight: moon.ageDays >= 14.76 ? 'auto' : '0',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF]">
                    <div className="text-[10.5px] text-[#8C8C8C]">Moonrise</div>
                    <div className="font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                      {moon.moonrise}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF]">
                    <div className="text-[10.5px] text-[#8C8C8C]">Moonset</div>
                    <div className="font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                      {moon.moonset}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF]">
                    <div className="text-[10.5px] text-[#8C8C8C]">Next Full Moon</div>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToDate(parseDateKey(moon.nextFullMoonDate));
                        onClose();
                      }}
                      className="font-semibold text-[#185D8F] hover:underline tabular-nums mt-0.5 cursor-pointer"
                    >
                      {moon.nextFullMoonDate}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF]">
                    <div className="text-[10.5px] text-[#8C8C8C]">Next New Moon</div>
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToDate(parseDateKey(moon.nextNewMoonDate));
                        onClose();
                      }}
                      className="font-semibold text-[#185D8F] hover:underline tabular-nums mt-0.5 cursor-pointer"
                    >
                      {moon.nextNewMoonDate}
                    </button>
                  </div>
                </div>

                <div className="text-[11.5px] text-[#666666] flex items-center justify-between pt-2 border-t border-[#EAEAEA] tabular-nums">
                  <span>Earth–Moon Distance</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {moon.distanceKm.toLocaleString()} km
                  </span>
                </div>
              </div>

              {/* Solar & Twilight Card */}
              <div className="p-4 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                    Solar Almanac &amp; Daylight
                  </div>
                  <div className="text-[18px] font-bold text-[#1A1A1A] mt-0.5 tabular-nums">
                    {solar.dayLength} daylight
                  </div>
                  <div className="text-[12px] text-[#666666] mt-0.5 tabular-nums">
                    Solar Noon {solar.solarNoon} · Night {solar.nightLength}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF] flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-[#D98E04] shrink-0" />
                    <div>
                      <div className="text-[10.5px] text-[#8C8C8C]">Sunrise</div>
                      <div className="font-semibold text-[#1A1A1A] tabular-nums">
                        {solar.sunrise}
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#EFEFEF] flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <div>
                      <div className="text-[10.5px] text-[#8C8C8C]">Sunset</div>
                      <div className="font-semibold text-[#1A1A1A] tabular-nums">
                        {solar.sunset}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#EAEAEA] text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">Morning Golden Hour</span>
                    <span className="font-mono text-[#1A1A1A] tabular-nums">
                      {solar.goldenHourMorning}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">Evening Golden Hour</span>
                    <span className="font-mono text-[#1A1A1A] tabular-nums">
                      {solar.goldenHourEvening}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">Civil Twilight</span>
                    <span className="font-mono text-[#1A1A1A] tabular-nums">
                      {solar.civilTwilightDawn} / {solar.civilTwilightDusk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#666666]">Astronomical Twilight</span>
                    <span className="font-mono text-[#1A1A1A] tabular-nums">
                      {solar.astronomicalTwilightDawn} / {solar.astronomicalTwilightDusk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === 'eclipses' && (
            <div className="space-y-3">
              {ECLIPSE_CATALOG.map((ecl) => (
                <div
                  key={ecl.id}
                  className="p-3.5 rounded-xl border border-[#EAEAEA] hover:border-[#D4D4D4] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#1A1A1A]">
                        {ecl.name}
                      </span>
                      <span className="text-[11px] font-mono text-[#737373] tabular-nums">
                        {ecl.dateKey}
                      </span>
                    </div>
                    <div className="text-[12px] text-[#525252]">
                      Peak {ecl.peakUtc} · Duration {ecl.duration} · Visibility: {ecl.visibilityRegions}
                    </div>
                    <div className="text-[11.5px] text-[#737373]">{ecl.localVisibilityNote}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToDate(parseDateKey(ecl.dateKey));
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[12px] font-medium text-[#1A1A1A] shrink-0 cursor-pointer"
                  >
                    View on Calendar
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === 'meteors' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANNUAL_METEOR_SHOWERS.map((sh) => (
                <div
                  key={sh.id}
                  className="p-3.5 rounded-xl border border-[#EAEAEA] bg-white space-y-1.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-[#1A1A1A]">
                        {sh.name}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-[#185D8F] tabular-nums">
                        ~{sh.expectedZhr}/hr
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[#525252]">
                      Peak: <strong>{sh.peakNight}</strong> · Active: {sh.activePeriod}
                    </div>
                    <div className="text-[11.5px] text-[#737373]">
                      Radiant: {sh.radiantConstellation} · Best: {sh.bestViewingHours}
                    </div>
                    <div className="text-[11px] text-[#737373]">{sh.visibilityNote}</div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToDate(parseDateKey(sh.peakDateKey));
                        onClose();
                      }}
                      className="text-[11.5px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                    >
                      Jump to peak night ({sh.peakDateKey})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'planets' && (
            <div className="space-y-3">
              {PLANETARY_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl border border-[#EAEAEA] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#1A1A1A]">
                        {ev.title}
                      </span>
                      <span className="text-[11px] font-mono text-[#737373] tabular-nums">
                        {ev.dateKey}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#525252]">{ev.description}</p>
                    <p className="text-[11.5px] text-[#737373]">{ev.viewingTip}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToDate(parseDateKey(ev.dateKey));
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-md border border-[#DCDCDC] hover:bg-[#F5F5F5] text-[12px] font-medium text-[#1A1A1A] shrink-0 cursor-pointer"
                  >
                    Jump to Date
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
