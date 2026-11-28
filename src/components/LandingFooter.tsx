import React from 'react';
import { LegalDocId } from './LegalModal';
import { WORLD_CALENDAR_SYSTEMS } from '../data/worldCalendars';

interface LandingFooterProps {
  onOpenCalendar: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
  onOpenAbout?: () => void;
  onOpenDownloadHub?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenCalendar,
  onOpenAbout,
  onOpenDownloadHub,
}) => {
  return (
    <footer className="bg-[#0F0F0F] border-t border-white/[0.1] text-[#858585]">

      <div className="max-w-[1080px] mx-auto px-5 sm:px-6 py-12 sm:py-14 flex flex-col md:flex-row justify-between gap-10">
        {/* Left Column: Brand, Tagline, Legal/Info Actions, Credit */}
        <div className="space-y-5 max-w-[340px]">
          <a
            href="#hero"
            className="inline-flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-white"
          >
            <img
              src="/android-chrome-192x192.png"
              alt=""
              className="w-5 h-5 object-contain shrink-0"
            />
            <span>Calander.Q</span>
          </a>

          <p className="text-[13.5px] leading-[1.45] text-[#858585]">
            The universal calendar built for precision. {WORLD_CALENDAR_SYSTEMS.length} world
            calendars, holidays, weather, and astronomy in one quiet workspace.
          </p>

          <div className="pt-1 flex items-center gap-2 text-[12.5px] text-[#858585] whitespace-nowrap">
            <span>© 2026</span>
            <span className="text-white font-medium">Calander.Q</span>
            <span>· Universal Calendar Platform</span>
            <span>· By Pandya Shweta</span>
          </div>
        </div>

        {/* Right Columns: Navigation & Product */}
        <div className="flex flex-wrap gap-12 sm:gap-16">
          <div className="space-y-3 min-w-[120px]">
            <div className="text-[14px] font-medium text-white">Navigation</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <a href="#core-features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#ways" className="hover:text-white transition-colors">
                  Platforms
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3 min-w-[120px]">
            <div className="text-[14px] font-medium text-white">Product</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Open Calendar
                </button>
              </li>
              <li>
                {onOpenDownloadHub ? (
                  <button
                    type="button"
                    onClick={onOpenDownloadHub}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Download App
                  </button>
                ) : (
                  <a href="/?page=download" className="hover:text-white transition-colors">
                    Download App
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
