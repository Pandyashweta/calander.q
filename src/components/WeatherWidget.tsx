import React, { useEffect, useRef, useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Umbrella,
  Wind,
  X,
} from 'lucide-react';
import {
  WeatherBundle,
  WeatherUnits,
  formatTempRounded,
  getWeatherIconUrl,
} from '../services/weatherService';
import { DAY_NAMES_SHORT, MONTH_NAMES, formatDateKey, parseDateKey } from '../utils/dateUtils';

interface WeatherWidgetProps {
  weather: WeatherBundle | null;
  loading: boolean;
  error: string | null;
  units: WeatherUnits;
  locationQuery: string;
  today: Date;
  onChangeUnits: (units: WeatherUnits) => void;
  onSearchCity: (cityQuery: string) => void;
  onUseGeolocation: () => void;
  onRefresh: () => void;
  onJumpToDate: (date: Date) => void;
  /** Compact variant for embedding inside mobile drawer */
  variant?: 'header' | 'sidebar';
}

export const FallbackWeatherIcon: React.FC<{
  conditionType?: string;
  isDaytime?: boolean;
  className?: string;
}> = ({ conditionType = '', isDaytime = true, className = 'w-4 h-4' }) => {
  const t = conditionType.toUpperCase();
  if (t.includes('THUNDER') || t.includes('STORM')) {
    return <CloudLightning className={`${className} text-[#D98E04]`} />;
  }
  if (t.includes('SNOW') || t.includes('SLEET') || t.includes('HAIL') || t.includes('ICE')) {
    return <CloudSnow className={`${className} text-[#3B9AE1]`} />;
  }
  if (t.includes('RAIN') || t.includes('SHOWER')) {
    return <CloudRain className={`${className} text-[#2B72A6]`} />;
  }
  if (t.includes('DRIZZLE')) {
    return <CloudDrizzle className={`${className} text-[#3B9AE1]`} />;
  }
  if (t.includes('FOG') || t.includes('MIST') || t.includes('HAZE')) {
    return <CloudFog className={`${className} text-[#8C8C8C]`} />;
  }
  if (t.includes('CLOUD') || t.includes('OVERCAST')) {
    return <Cloud className={`${className} text-[#7A7A7A]`} />;
  }
  if (!isDaytime) {
    return <Moon className={`${className} text-[#5568D9]`} />;
  }
  return <Sun className={`${className} text-[#E69A14]`} />;
};

export const WeatherConditionIcon: React.FC<{
  iconBaseUri: string | null;
  conditionType?: string;
  isDaytime?: boolean;
  alt: string;
  className?: string;
}> = ({ iconBaseUri, conditionType, isDaytime, alt, className = 'w-4 h-4' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const src = getWeatherIconUrl(iconBaseUri);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (!src || imgFailed) {
    return (
      <FallbackWeatherIcon
        conditionType={conditionType}
        isDaytime={isDaytime}
        className={className}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${className} object-contain shrink-0`}
    />
  );
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  loading,
  error,
  units,
  locationQuery,
  today,
  onChangeUnits,
  onSearchCity,
  onUseGeolocation,
  onRefresh,
  onJumpToDate,
  variant = 'header',
}) => {
  const [open, setOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    onSearchCity(trimmed);
    setCityInput('');
  };

  const handleLocateClick = () => {
    setGeoBusy(true);
    onUseGeolocation();
    window.setTimeout(() => setGeoBusy(false), 1200);
  };

  const todayKey = formatDateKey(today);
  const todayForecast = weather?.daily.find((d) => d.dateKey === todayKey) || weather?.daily[0];

  const triggerButton =
    variant === 'sidebar' ? (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#E6E6E6] hover:bg-[#F5F5F5] flex items-center justify-between gap-2 transition-colors cursor-pointer"
        title="View weather forecast for primary calendar location"
      >
        <div className="flex items-center gap-2 min-w-0">
          {weather ? (
            <WeatherConditionIcon
              iconBaseUri={weather.current.iconBaseUri}
              conditionType={weather.current.conditionType}
              isDaytime={weather.current.isDaytime}
              alt={weather.current.conditionText}
              className="w-5 h-5"
            />
          ) : (
            <Sun className="w-4 h-4 text-[#E69A14] shrink-0" />
          )}
          <div className="min-w-0 text-left">
            <div className="text-[12px] font-semibold text-[#1A1A1A] truncate">
              {weather ? weather.location.name : locationQuery.split(',')[0]}
            </div>
            <div className="text-[10.5px] text-[#7A7A7A] truncate">
              {loading
                ? 'Updating forecast...'
                : error
                ? 'Weather unavailable'
                : weather?.current.conditionText || 'Check forecast'}
            </div>
          </div>
        </div>
        <span className="text-[13.5px] font-semibold text-[#1A1A1A] tabular-nums shrink-0">
          {weather ? formatTempRounded(weather.current.temperature) : '--'}
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Current weather and 5-day forecast"
        title={
          weather
            ? `${weather.location.name}: ${weather.current.conditionText}, ${formatTempRounded(
                weather.current.temperature
              )}`
            : 'Weather forecast for primary calendar location'
        }
        className={`h-[30px] px-2 sm:px-2.5 rounded-[6px] border text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          open
            ? 'bg-[#F3F3F3] border-[#D4D4D4] text-[#1A1A1A]'
            : 'bg-white border-[#E4E4E4] text-[#3F3F3F] hover:bg-[#F5F5F5]'
        }`}
      >
        {loading && !weather ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-[#8C8C8C] animate-spin" />
            <span className="text-[#8C8C8C] hidden sm:inline">Weather</span>
          </>
        ) : weather ? (
          <>
            <WeatherConditionIcon
              iconBaseUri={weather.current.iconBaseUri}
              conditionType={weather.current.conditionType}
              isDaytime={weather.current.isDaytime}
              alt={weather.current.conditionText}
              className="w-4 h-4"
            />
            <span className="font-semibold text-[#1A1A1A] tabular-nums">
              {formatTempRounded(weather.current.temperature)}
            </span>
            <span className="text-[#737373] hidden xl:inline max-w-[96px] truncate">
              {weather.location.name}
            </span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-[#8C8C8C]" />
            <span className="text-[#737373] hidden sm:inline">Weather</span>
          </>
        )}
      </button>
    );

  return (
    <div ref={containerRef} className="relative">
      {triggerButton}

      {open && (
        <div
          role="dialog"
          aria-label="Weather Forecast"
          className={`${
            variant === 'sidebar'
              ? 'left-0 right-0 mt-1.5'
              : 'right-0 mt-1.5 w-[min(92vw,332px)]'
          } absolute z-50 bg-white border border-[#E2E2E2] rounded-xl shadow-xl overflow-hidden text-left`}
        >
          {/* Popover Header */}
          <div className="px-3.5 py-2.5 border-b border-[#EFEFEF] flex items-center justify-between gap-2 bg-[#FAFAFA]">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#737373] shrink-0" />
              <span className="text-[12.5px] font-semibold text-[#1A1A1A] truncate">
                {weather?.location.name || locationQuery.split(',')[0]}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* °C / °F Unit Switch */}
              <div className="inline-flex rounded-md border border-[#E2E2E2] bg-white overflow-hidden text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => onChangeUnits('METRIC')}
                  className={`px-1.5 py-0.5 cursor-pointer transition-colors ${
                    units === 'METRIC'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#666666] hover:bg-[#F3F3F3]'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => onChangeUnits('IMPERIAL')}
                  className={`px-1.5 py-0.5 cursor-pointer transition-colors ${
                    units === 'IMPERIAL'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#666666] hover:bg-[#F3F3F3]'
                  }`}
                >
                  °F
                </button>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh forecast"
                aria-label="Refresh weather forecast"
                className="p-1 rounded hover:bg-[#ECECEC] text-[#737373] hover:text-[#1A1A1A] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close weather panel"
                className="p-1 rounded hover:bg-[#ECECEC] text-[#737373] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3.5">
            {/* Loading State (initial) */}
            {loading && !weather && (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-[#7A7A7A]">
                <RefreshCw className="w-5 h-5 animate-spin text-[#8C8C8C]" />
                <span className="text-[12px]">Fetching live forecast...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg bg-[#FFF5F5] border border-[#F5C2C7] px-3 py-2.5 space-y-1.5">
                <div className="text-[12px] font-medium text-[#8A1520] leading-snug">
                  {error}
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="text-[11.5px] font-medium text-[#185D8F] hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Current Weather Summary */}
            {weather && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F7F7F7] border border-[#EFEFEF] flex items-center justify-center shrink-0">
                      <WeatherConditionIcon
                        iconBaseUri={weather.current.iconBaseUri}
                        conditionType={weather.current.conditionType}
                        isDaytime={weather.current.isDaytime}
                        alt={weather.current.conditionText}
                        className="w-8 h-8"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[26px] font-bold tracking-tight text-[#1A1A1A] leading-none tabular-nums">
                          {formatTempRounded(weather.current.temperature)}
                        </span>
                        <span className="text-[12px] font-medium text-[#7A7A7A]">
                          {weather.current.tempUnitSymbol}
                        </span>
                      </div>
                      <div className="text-[12px] font-medium text-[#4A4A4A] truncate mt-1">
                        {weather.current.conditionText}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5 text-[11px] text-[#737373] tabular-nums">
                    {weather.current.feelsLike !== null && (
                      <div>Feels {formatTempRounded(weather.current.feelsLike)}</div>
                    )}
                    {(todayForecast?.maxTemp !== null || weather.current.high24h !== null) && (
                      <div className="font-medium text-[#3F3F3F]">
                        H:{' '}
                        {formatTempRounded(
                          todayForecast?.maxTemp ?? weather.current.high24h
                        )}{' '}
                        · L:{' '}
                        {formatTempRounded(
                          todayForecast?.minTemp ?? weather.current.low24h
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Planning Metrics Strip */}
                <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-[#F0F0F0]">
                  <div className="rounded-md bg-[#FAFAFA] border border-[#F0F0F0] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#8C8C8C]">
                      <Umbrella className="w-2.5 h-2.5" />
                      <span>Rain</span>
                    </div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                      {weather.current.precipPercent !== null
                        ? `${weather.current.precipPercent}%`
                        : '--'}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#FAFAFA] border border-[#F0F0F0] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#8C8C8C]">
                      <Droplets className="w-2.5 h-2.5" />
                      <span>Humid</span>
                    </div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                      {weather.current.humidity !== null
                        ? `${weather.current.humidity}%`
                        : '--'}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#FAFAFA] border border-[#F0F0F0] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#8C8C8C]">
                      <Wind className="w-2.5 h-2.5" />
                      <span>Wind</span>
                    </div>
                    <div className="text-[11.5px] font-semibold text-[#1A1A1A] tabular-nums mt-0.5 truncate">
                      {weather.current.windSpeed !== null
                        ? `${Math.round(weather.current.windSpeed)} ${weather.current.windUnitLabel}`
                        : '--'}
                    </div>
                  </div>
                  <div className="rounded-md bg-[#FAFAFA] border border-[#F0F0F0] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#8C8C8C]">
                      <Sun className="w-2.5 h-2.5" />
                      <span>UV</span>
                    </div>
                    <div className="text-[12px] font-semibold text-[#1A1A1A] tabular-nums mt-0.5">
                      {weather.current.uvIndex !== null ? weather.current.uvIndex : '--'}
                    </div>
                  </div>
                </div>

                {/* 5-Day Forecast aligned with Calendar Dates */}
                {weather.daily.length > 0 && (
                  <div className="pt-2.5 border-t border-[#F0F0F0] space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-[#737373]">
                        5-Day Planning Forecast
                      </span>
                      <span className="text-[10px] text-[#9A9A9A]">
                        Click a day to jump
                      </span>
                    </div>

                    <div className="divide-y divide-[#F5F5F5]">
                      {weather.daily.slice(0, 5).map((day) => {
                        const d = parseDateKey(day.dateKey);
                        const isToday = day.dateKey === todayKey;
                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            onClick={() => {
                              onJumpToDate(d);
                              setOpen(false);
                            }}
                            className="w-full py-1.5 px-1.5 -mx-1.5 rounded-md hover:bg-[#F5F5F5] flex items-center justify-between gap-2 text-[12px] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-[58px] text-left shrink-0 ${
                                  isToday
                                    ? 'font-semibold text-[#F04422]'
                                    : 'font-medium text-[#1F1F1F]'
                                }`}
                              >
                                {isToday
                                  ? 'Today'
                                  : `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()}`}
                              </span>
                              <WeatherConditionIcon
                                iconBaseUri={day.iconBaseUri}
                                conditionType={day.conditionType}
                                isDaytime
                                alt={day.conditionText}
                                className="w-4 h-4"
                              />
                              <span className="text-[11.5px] text-[#666666] truncate">
                                {day.conditionText}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 tabular-nums">
                              {day.precipPercent !== null && day.precipPercent >= 15 && (
                                <span className="text-[10.5px] text-[#2B72A6] font-medium">
                                  {day.precipPercent}%
                                </span>
                              )}
                              <span className="text-[11.5px] text-[#8C8C8C]">
                                {formatTempRounded(day.minTemp)}
                              </span>
                              <span className="text-[12px] font-semibold text-[#1A1A1A] w-[26px] text-right">
                                {formatTempRounded(day.maxTemp)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Change Location Search + Explicit Browser Geolocation */}
            <div className="pt-2.5 border-t border-[#EFEFEF] space-y-2">
              <form onSubmit={handleCitySubmit} className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-[#9A9A9A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Switch city (e.g. Mumbai, London)..."
                    className="w-full h-[30px] pl-7 pr-2 rounded-md border border-[#E2E2E2] bg-white text-[12px] text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#3B9AE1]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!cityInput.trim() || loading}
                  className="h-[30px] px-2.5 rounded-md bg-[#1A1A1A] hover:bg-[#333333] disabled:opacity-40 text-white text-[11.5px] font-medium cursor-pointer shrink-0 transition-colors"
                >
                  Set
                </button>
              </form>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleLocateClick}
                  disabled={geoBusy || loading}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#185D8F] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{geoBusy ? 'Locating...' : 'Use my current location'}</span>
                </button>

                <span className="text-[10px] text-[#9A9A9A] tabular-nums">
                  {MONTH_NAMES[today.getMonth()].slice(0, 3)} {today.getDate()} · Google Weather
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
