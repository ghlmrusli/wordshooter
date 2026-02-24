'use client';

import { useState, useEffect } from 'react';

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTinyMobile, setIsTinyMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobileQuery = window.matchMedia('(max-width: 1024px), (pointer: coarse)');
      const smallQuery = window.matchMedia('(max-width: 480px)');
      const tinyQuery = window.matchMedia('(max-width: 375px)');

      setIsMobile(mobileQuery.matches);
      setIsSmallMobile(smallQuery.matches);
      setIsTinyMobile(tinyQuery.matches);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isSmallMobile, isTinyMobile };
}
