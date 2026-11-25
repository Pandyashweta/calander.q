import { useEffect, useState } from 'react';

export interface ViewportInfo {
  width: number;
  /** < 640px: phones */
  isPhone: boolean;
  /** < 768px: mobile / narrow portrait */
  isMobile: boolean;
  /** < 1024px: sidebars become slide-over drawers */
  isDrawerMode: boolean;
  /** >= 1200px: full 3-panel desktop workspace */
  isWideDesktop: boolean;
}

function measureViewport(): ViewportInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  return {
    width,
    isPhone: width < 640,
    isMobile: width < 768,
    isDrawerMode: width < 1024,
    isWideDesktop: width >= 1200,
  };
}

export function useViewport(): ViewportInfo {
  const [vp, setVp] = useState<ViewportInfo>(measureViewport);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        setVp(measureViewport());
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return vp;
}
