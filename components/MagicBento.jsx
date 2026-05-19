import { useRef, useEffect, useCallback, useState, forwardRef } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';
import DotField from './DotField';
import { BackgroundBeams } from '../components/ui/background-beams';
import { AnimatedBeam } from '../components/ui/animated-beam';
import { cn } from '../lib/utils';
import { GlowingStarsBackgroundCard } from './ui/glowing-stars';
import { Globe } from './ui/globe';
import AnimatedBeamMultipleOutputDemo from './animated-beam-multiple-inputs';
import { DottedGlowBackground } from './ui/dotted-glow-background';
import { Cobe } from './ui/cobe-globe';
import SpotlightCard from './SpotlightCard';
import WorldMap from './ui/world-map';
import WorldMapDemo from './world-map-demo';
import { DottedMap } from './ui/dotted-map';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '6, 182, 212';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  { color: '#120F17', title: 'Our Mission',     description: 'To empower businesses through innovative digital solutions that blend creativity, technology, and strategy—helping brands grow, connect, and succeed in the digital world.',        label: ''     },
  { color: '#120F17', title: 'Our Vision',     description: 'To become a global leader in digital transformation, setting new standards in web, app, and software development through innovation, excellence, and client success.',       label: ''     },
  { color: '#120F17', title: 'We combine innovation, design, and technology to create digital solutions that drive real results.', description: 'Our team of experts specializes in web, app, and software development—empowering businesses to grow smarter, faster, and stronger. With a focus on user experience, performance, and reliability, we turn complex challenges into seamless digital experiences that deliver measurable success.',    label: ''     },
  { color: '#120F17', title: 'Providing Programming Solutions Under One Roof',    description: '',        label: ''  },

  { color: '#120F17', title: 'We Organize All Your Scattered Ideas.',   description: '',      label: '' },
  { color: '#120F17', title: 'We’re Borderless.',      description: '', label: ''   },

  // { color: '#120F17', title: 'We organize all your Scattered Ideas.',   description: '',      label: '' },
  // { color: '#120F17', title: '',      description: '', label: 'We’re Borderless.'   }

];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: rgba(${color}, 1); box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none; z-index: 300; left: ${x}px; top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--glow-x', `${((mouseX - rect.left) / rect.width) * 100}%`);
  card.style.setProperty('--glow-y', `${((mouseY - rect.top) / rect.height) * 100}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

// ─────────────────────────────────────────────────────────────────────────────
// BeamCircle & BeamIcons
// ─────────────────────────────────────────────────────────────────────────────

const BeamCircle = forwardRef(({ className, children, style }, ref) => (
  <div
    ref={ref}
    style={style}
    className={cn(
      'z-10 flex size-10 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] backdrop-blur-sm',
      className
    )}
  >
    {children}
  </div>
));
BeamCircle.displayName = 'BeamCircle';

const BeamIcons = {
  notion: () => (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#ffffff" />
      <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000000" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  ),
  openai: () => (
    <svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="white">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  ),
  googleDrive: () => (
    <svg width="100" height="100" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  ),
  whatsapp: () => (
    <svg width="100" height="100" viewBox="0 0 175.216 175.552" xmlns="http://www.w3.org/2000/svg">
      <path d="m54.532 138.45 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.523h.023c33.707 0 61.139-27.426 61.153-61.135.006-16.335-6.349-31.696-17.895-43.251A60.75 60.75 0 0 0 87.94 25.983c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.558zm-40.811 23.544L24.16 123.88c-6.438-11.154-9.825-23.808-9.821-36.772.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954zm0 0" fill="#b3b3b3" />
      <path d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z" fill="#ffffff" />
      <path d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z" fill="#25d366" />
      <path d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647" fill="#ffffff" fillRule="evenodd" />
    </svg>
  ),
  messenger: () => (
    <svg width="100" height="100" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <radialGradient id="msgGrad" cx="11.087" cy="7.022" r="47.612" gradientTransform="matrix(1 0 0 -1 0 50)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1292ff" /><stop offset=".428" stopColor="#6d53ff" /><stop offset=".946" stopColor="#ff6257" />
      </radialGradient>
      <path fill="url(#msgGrad)" d="M44,23.5C44,34.27,35.05,43,24,43c-1.651,0-3.25-0.194-4.784-0.564c-0.465-0.112-0.951-0.069-1.379,0.145L13.46,44.77C12.33,45.335,11,44.513,11,43.249v-4.025c0-0.575-0.257-1.111-0.681-1.499C6.425,34.165,4,29.11,4,23.5C4,12.73,12.95,4,24,4S44,12.73,44,23.5z" />
      <path fill="#ffffff" d="M34.394,18.501l-5.7,4.22c-0.61,0.46-1.44,0.46-2.04,0.01L22.68,19.74c-1.68-1.25-4.06-0.82-5.19,0.94l-1.21,1.89l-4.11,6.68c-0.6,0.94,0.55,2.01,1.44,1.34l5.7-4.22c0.61-0.46,1.44-0.46,2.04-0.01l3.974,2.991c1.68,1.25,4.06,0.82,5.19-0.94l1.21-1.89l4.11-6.68C36.434,18.901,35.284,17.831,34.394,18.501z" />
    </svg>
  ),
  googleDocs: () => (
    <svg width="100" height="100" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#2196F3" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
      <path fill="#BBDEFB" d="M40,13H30V3L40,13z"/>
      <path fill="#ffffff" d="M15,23h18v2H15V23z M15,27h18v2H15V27z M15,31h13v2H15V31z M15,19h7v2h-7V19z"/>
    </svg>
  ),
  zapier: () => (
    <svg width="100" height="100" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#FF4A00"/>
      <path fill="#ffffff" d="M24,10.5c-7.456,0-13.5,6.044-13.5,13.5S16.544,37.5,24,37.5S37.5,31.456,37.5,24S31.456,10.5,24,10.5z M29.5,26.5h-3.586l5.293,5.293l-1.414,1.414L24.5,27.914V31.5h-2v-7h7V26.5z M24.5,20.086l5.293-5.293l1.414,1.414L25.914,21.5H29.5v2h-7v-7h2V20.086z M18.5,21.5h3.586l-5.293-5.293l1.414-1.414L23.5,20.086V16.5h2v7h-7V21.5z M23.5,27.914l-5.293,5.293l-1.414-1.414l5.293-5.293H18.5v-2h7v7h-2V27.914z"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedBeamBackground — card index 3 ("Automation")
// 3-column grid layout matching the reference image curvature
// ─────────────────────────────────────────────────────────────────────────────

const AnimatedBeamBackground = () => {
  const containerRef = useRef(null);
  const div1Ref = useRef(null); // top-left:    Google Drive
  const div2Ref = useRef(null); // mid-left:    Notion
  const div3Ref = useRef(null); // bottom-left: WhatsApp
  const div4Ref = useRef(null); // center:      OpenAI
  const div5Ref = useRef(null); // top-right:   Google Docs
  const div6Ref = useRef(null); // mid-right:   Zapier
  const div7Ref = useRef(null); // bottom-right: Messenger

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 3-column grid: left icons | center OpenAI | right icons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        width: '100%',
        height: '100%',
        alignItems: 'center',
      }}>
        {/* ── Left column ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          height: '100%',
          paddingTop: '4px',
          paddingBottom: '4px',
        }}>
          <BeamCircle ref={div1Ref}><BeamIcons.googleDrive /></BeamCircle>
          <BeamCircle ref={div2Ref}><BeamIcons.notion /></BeamCircle>
          <BeamCircle ref={div3Ref}><BeamIcons.whatsapp /></BeamCircle>
        </div>

        {/* ── Center ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BeamCircle
            ref={div4Ref}
            style={{ width: '52px', height: '52px' }}
          >
            <BeamIcons.openai />
          </BeamCircle>
        </div>

        {/* ── Right column ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '100%',
          paddingTop: '4px',
          paddingBottom: '4px',
        }}>
          <BeamCircle ref={div5Ref}><BeamIcons.googleDocs /></BeamCircle>
          <BeamCircle ref={div6Ref}><BeamIcons.zapier /></BeamCircle>
          <BeamCircle ref={div7Ref}><BeamIcons.messenger /></BeamCircle>
        </div>
      </div>

      {/* ── Left-side beams: fan outward from center ── */}
      {/* top-left    → center: curves upward   */}
      <AnimatedBeam containerRef={containerRef} fromRef={div1Ref} toRef={div4Ref} curvature={-60} />
      {/* mid-left    → center: straight        */}
      <AnimatedBeam containerRef={containerRef} fromRef={div2Ref} toRef={div4Ref} curvature={0} />
      {/* bottom-left → center: curves downward */}
      <AnimatedBeam containerRef={containerRef} fromRef={div3Ref} toRef={div4Ref} curvature={60} />

      {/* ── Right-side beams: mirrored, reverse direction ── */}
      {/* top-right    → center: curves upward   */}
      <AnimatedBeam containerRef={containerRef} fromRef={div5Ref} toRef={div4Ref} curvature={60}  reverse />
      {/* mid-right    → center: straight        */}
      <AnimatedBeam containerRef={containerRef} fromRef={div6Ref} toRef={div4Ref} curvature={0}   reverse />
      {/* bottom-right → center: curves downward */}
      <AnimatedBeam containerRef={containerRef} fromRef={div7Ref} toRef={div4Ref} curvature={-60} reverse />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GlowingStarsBackground — card index 4 ("Integration")
// ─────────────────────────────────────────────────────────────────────────────

// const GlowingStarsBackground = () => {
//   const [glowingStars, setGlowingStars] = useState([]);
//   const stars = 108;
//   const columns = 18;

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const newGlowing = Array.from({ length: 5 }, () =>
//         Math.floor(Math.random() * stars)
//       );
//       setGlowingStars(newGlowing);
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div
//       style={{
//         position: 'absolute',
//         inset: 0,
//         width: '100%',
//         height: '100%',
//         zIndex: 0,
//         pointerEvents: 'none',
//         overflow: 'hidden',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//       }}
//     >
//       <div
//         style={{
//           display: 'grid',
//           gridTemplateColumns: `repeat(${columns}, 1fr)`,
//           gap: '1px',
//           width: '100%',
//           height: '100%',
//           padding: '8px',
//         }}
//       >
//         {Array.from({ length: stars }).map((_, i) => {
//           const isGlowing = glowingStars.includes(i);
//           return (
//             <div
//               key={i}
//               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
//             >
//               <div
//                 style={{
//                   width: isGlowing ? '3px' : '1.5px',
//                   height: isGlowing ? '3px' : '1.5px',
//                   borderRadius: '50%',
//                   backgroundColor: isGlowing ? '#E2CBFF' : 'rgba(255,255,255,0.3)',
//                   boxShadow: isGlowing
//                     ? '0 0 8px 2px rgba(134,0,255,0.8), 0 0 16px 4px rgba(134,0,255,0.4)'
//                     : 'none',
//                   transition: 'all 1s ease',
//                   transform: isGlowing ? 'scale(1.5)' : 'scale(1)',
//                 }}
//               />
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// ─────────────────────────────────────────────────────────────────────────────
// ParticleCard
// ─────────────────────────────────────────────────────────────────────────────
const ParticleCard = ({
  children, className = '', disableAnimations = false, style,
  particleCount = DEFAULT_PARTICLE_COUNT, glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true, clickEffect = false, enableMagnetism = false
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach(particle => {
      gsap.to(particle, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => { particle.parentNode?.removeChild(particle); } });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();
    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);
        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(clone, { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
        gsap.to(clone, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      if (enableTilt) gsap.to(element, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    };
    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      if (enableTilt) gsap.to(element, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
      if (enableMagnetism) gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseMove = e => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;
      if (enableTilt) gsap.to(element, { rotateX: ((y - cy) / cy) * -10, rotateY: ((x - cx) / cx) * 10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      if (enableMagnetism) magnetismAnimationRef.current = gsap.to(element, { x: (x - cx) * 0.05, y: (y - cy) * 0.05, duration: 0.3, ease: 'power2.out' });
    };
    const handleClick = e => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const d = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
      const ripple = document.createElement('div');
      ripple.style.cssText = `position:absolute;width:${d*2}px;height:${d*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-d}px;top:${y-d}px;pointer-events:none;z-index:1000;`;
      element.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);
    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={`${className} particle-container`} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

// Replace GlowingStarsBackgroundWrapped with a hover-aware version
const GlowingStarsBackgroundWrapped = ({ isHovered = false }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      pointerEvents: 'none',
      
    }}
  >
    <GlowingStarsBackgroundCard allGlow={isHovered} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// GlobalSpotlight
// ─────────────────────────────────────────────────────────────────────────────
const GlobalSpotlight = ({ gridRef, disableAnimations = false, enabled = true, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor = DEFAULT_GLOW_COLOR }) => {
  const spotlightRef = useRef(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `position:fixed;width:800px;height:800px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(${glowColor},0.15) 0%,rgba(${glowColor},0.08) 15%,rgba(${glowColor},0.04) 25%,rgba(${glowColor},0.02) 40%,rgba(${glowColor},0.01) 65%,transparent 70%);z-index:200;opacity:0;transform:translate(-50%,-50%);mix-blend-mode:screen;`;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');
      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(card => { card.style.setProperty('--glow-intensity', '0'); });
        return;
      }
      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;
      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const ed = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(r.width, r.height) / 2);
        minDistance = Math.min(minDistance, ed);
        let gi = 0;
        if (ed <= proximity) gi = 1;
        else if (ed <= fadeDistance) gi = (fadeDistance - ed) / (fadeDistance - proximity);
        updateCardGlowProperties(card, e.clientX, e.clientY, gi, spotlightRadius);
      });
      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });
      const to = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity: to, duration: to > 0 ? 0.2 : 0.5, ease: 'power2.out' });
    };
    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => { card.style.setProperty('--glow-intensity', '0'); });
      if (spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div className="card-grid bento-section" ref={gridRef}>{children}</div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// ─────────────────────────────────────────────────────────────────────────────
// Static background wrappers
// ─────────────────────────────────────────────────────────────────────────────

const DotFieldBackground = () => (
  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
    <DotField dotRadius={1.5} dotSpacing={14} bulgeStrength={67} glowRadius={160} sparkle={false} waveAmplitude={0} cursorRadius={500} cursorForce={0.1} bulgeOnly gradientFrom="#06B6D4" gradientTo="#67E8F9" glowColor="#120F17" />
  </div>
);

const BackgroundBeamsBackground = () => (
  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <BackgroundBeams />
  </div>
);
// In your component file, create a wrapper:
// ── CobeBackground ──
const CobeBackground = () => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ width: '300px', height: '300px', flexShrink: 0 }}>
        <Cobe variant="auto-rotation" />
      </div>
    </div>
  );
};

const CardContent = ({
  card, isFirst, isThird, isFourth, isFifth, isSixth,
  hideDescription = false, hideHeader = false,
  isFifthHovered = false, onTextClick = undefined, onTitleClick = undefined, titleExpanded = false,
}) => (
  <>
    <div className={`magic-bento-card__text  ${isFifth ? "isfifth_content" : ""}`} style={{ position: 'relative', zIndex: 2, pointerEvents: 'auto', cursor: 'pointer' }} onClick={onTextClick}>
      {!hideHeader && (
        <>
          <div className="magic-bento-card__header" style={{ position: 'relative', zIndex: 2 }}>
            <div className="magic-bento-card__label">{card.label}</div>
          </div>
          <div className={`magic-bento-card__content ${isThird ? "flex flex-col gap-8 " : ""}`}>
            <h2 className={`magic-bento-card__title ${isFifth ? 'magic-bento-card__title--fifth' : ''} ${titleExpanded ? 'magic-bento-card__title--expanded' : ''}`} onClick={onTitleClick} style={{ cursor: onTitleClick ? 'pointer' : 'inherit' }}>{card.title}</h2>
            {!hideDescription && (
              <p className={`magic-bento-card__description ${isThird ? 'magic-bento-card__description--third' : ''} ${isFifth ? 'animate-text-reveal' : ''}`}>
                {card.description}
              </p>
            )}
          </div>
        </>
      )}
    </div>

    {isFirst  && <DottedGlowBackground />}
    {isThird  && <BackgroundBeamsBackground />}
    {isFourth && <AnimatedBeamMultipleOutputDemo />}
    {isFifth  && <GlowingStarsBackgroundWrapped isHovered={isFifthHovered} />}
    {isSixth && (
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <DottedMap dotRadius={0.2} className="h-full min-h-0 w-full" />
      </div>
    )}
  </>
);

// ── MagicBento — add cobeKey state and pass it through ──
const MagicBento = ({
  textAutoHide = true, enableStars = true, enableSpotlight = true,
  enableBorderGlow = true, disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false, glowColor = DEFAULT_GLOW_COLOR, clickEffect = true, enableMagnetism = true
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const [isFifthHovered, setIsFifthHovered] = useState(false);
  const [expandedTitleIndex, setExpandedTitleIndex] = useState(null);

  const toggleTitleExpanded = (cardIndex) => {
    setExpandedTitleIndex(prev => prev === cardIndex ? null : cardIndex);
  };

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}
      <BentoCardGrid gridRef={gridRef}>
        {cardData.map((card, index) => {
          const isFirst  = index === 0 || index === 1;
          const isThird  = index === 2;
          const isFourth = index === 3;
          const isFifth  = index === 4;
          const isSixth  = index === 5;

          const isMission = index === 0;
          const isVision  = index === 1;
          const baseClassName = `magic-bento-card ${isMission ? 'magic-bento-card--mission' : ''} ${isVision ? 'magic-bento-card--vision' : ''} ${isFourth ? 'magic-bento-card--fourth' : ''} ${isFifth ? 'magic-bento-card--fifth' : ''} ${isSixth ? 'magic-bento-card--sixth' : ''} ${textAutoHide ? 'magic-bento-card--text-autohide' : ''} ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;
          const cardStyle = {
            backgroundColor: 'rgba(18, 15, 23, 0.7)',
            backdropFilter: 'blur(10px)',
            '--glow-color': glowColor,
            position: 'relative',
            overflow: 'hidden',
          };

          if (enableStars) {
            return (
              <div
                key={index}
                onMouseEnter={() => { if (isFifth) setIsFifthHovered(true); }}
                onMouseLeave={() => { if (isFifth) setIsFifthHovered(false); }}
              >
                <ParticleCard
                  className={baseClassName}
                  style={cardStyle}
                  disableAnimations={shouldDisableAnimations}
                  particleCount={particleCount}
                  glowColor={glowColor}
                  enableTilt={enableTilt}
                  clickEffect={clickEffect}
                  enableMagnetism={enableMagnetism}
                >
                  <SpotlightCard
                    className="custom-spotlight-card"
                    spotlightColor="rgba(0, 229, 255, 0.2)"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
                  >
                    <CardContent
                      card={card}
                      isFirst={isFirst}
                      isThird={isThird}
                      isFourth={isFourth}
                      isFifth={isFifth}
                      isSixth={isSixth}
                      hideDescription={false}
                      hideHeader={false}
                      isFifthHovered={isFifth ? isFifthHovered : false}
                      onTitleClick={isFourth && isMobile ? () => toggleTitleExpanded(index) : undefined}
                      titleExpanded={expandedTitleIndex === index}
                    />
                  </SpotlightCard>
                </ParticleCard>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={baseClassName}
              style={cardStyle}
              onMouseEnter={() => { if (isFifth) setIsFifthHovered(true); }}
              onMouseLeave={() => { if (isFifth) setIsFifthHovered(false); }}
              ref={el => {
                if (!el) return;
                const handleMouseMove = e => {
                  if (shouldDisableAnimations) return;
                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left, y = e.clientY - rect.top;
                  const cx = rect.width / 2, cy = rect.height / 2;
                  if (enableTilt) gsap.to(el, { rotateX: ((y - cy) / cy) * -10, rotateY: ((x - cx) / cx) * 10, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
                  if (enableMagnetism) gsap.to(el, { x: (x - cx) * 0.05, y: (y - cy) * 0.05, duration: 0.3, ease: 'power2.out' });
                };
                const handleMouseLeave = () => {
                  if (shouldDisableAnimations) return;
                  if (enableTilt) gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
                  if (enableMagnetism) gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
                };
                const handleClick = e => {
                  if (!clickEffect || shouldDisableAnimations) return;
                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left, y = e.clientY - rect.top;
                  const d = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
                  const ripple = document.createElement('div');
                  ripple.style.cssText = `position:absolute;width:${d*2}px;height:${d*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${glowColor},0.4) 0%,rgba(${glowColor},0.2) 30%,transparent 70%);left:${x-d}px;top:${y-d}px;pointer-events:none;z-index:1000;`;
                  el.appendChild(ripple);
                  gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
                };
                el.addEventListener('mousemove', handleMouseMove);
                el.addEventListener('mouseleave', handleMouseLeave);
                el.addEventListener('click', handleClick);
              }}
            >
              <CardContent
                card={card}
                isFirst={isFirst}
                isThird={isThird}
                isFourth={isFourth}
                isFifth={isFifth}
                isSixth={isSixth}
                hideDescription={false}
                hideHeader={false}
                isFifthHovered={isFifth ? isFifthHovered : false}
                onTitleClick={isFourth && isMobile ? () => toggleTitleExpanded(index) : undefined}
                titleExpanded={expandedTitleIndex === index}
              />
            </div>
          );
        })}
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;