'use client';

import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
   
    const target = document.querySelector('main') || window;

    const handleScroll = () => {
      const scrollTop =
        target === window
          ? window.scrollY || document.documentElement.scrollTop
          : target.scrollTop;

      console.log('ScrollTop:', scrollTop); 
      setIsVisible(scrollTop > 100);
    };

    target.addEventListener('scroll', handleScroll);
    return () => target.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed bottom-6 right-6 z-[99999]
        flex items-center justify-center
        p-3 rounded-full
        bg-cyan-400 text-white
        hover:bg-cyan-600 hover:text-black
        shadow-lg transition-all duration-300
      "
    >
      <FaArrowUp size={20} />
    </button>
  );
}
