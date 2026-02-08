"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import UserMenu from "./UserMenu";
import { SAFE_GAP, BREAKPOINT_TABLET } from "../lib/constants";

// Initialize theme from localStorage (client-side only)
function getInitialTheme(): string {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("theme") || "light";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required for hydration
    setMounted(true);
    // Sync document attribute with state (theme already initialized from localStorage)
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Track viewport size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= BREAKPOINT_TABLET);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic nav height measurement and CSS variable setting
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty('--nav-height-actual', `${height}px`);
        document.documentElement.style.setProperty('--safe-gap', `${SAFE_GAP}px`);
        document.documentElement.style.setProperty('--content-top', `${height + SAFE_GAP}px`);
      }
    };
    
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    return () => window.removeEventListener('resize', updateNavHeight);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on navigation
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  const isActive = (path: string) => pathname.startsWith(path);

  const navLinks = [
    {
      href: "/functions",
      label: "Functions",
      subLinks: [
        { href: "/functions", label: "Browse" },
        { href: "/functions/create", label: "Create" },
        { href: "/profiles", label: "Profiles" },
        { href: "/profiles/train", label: "Train" },
      ],
    },
    {
      href: "/ensembles",
      label: "Ensembles",
      subLinks: [
        { href: "/ensembles", label: "Browse" },
        { href: "/ensembles/create", label: "Create" },
        { href: "/ensemble-llms", label: "LLMs" },
        { href: "/ensemble-llms/create", label: "Create LLM" },
      ],
    },
    {
      href: "/sdk-first",
      label: "Freeform",
      subLinks: [
        { href: "/sdk-first", label: "SDK-First" },
        { href: "/vibe-native", label: "Vibe-Native" },
        { href: "/chat", label: "Chat" },
        { href: "/vector", label: "Vector" },
      ],
    },
    {
      href: "/information",
      label: "Information",
      subLinks: [
        { href: "/people", label: "Team" },
        { href: "/information", label: "Info" },
        { href: "/legal", label: "Legal" },
      ],
    },
  ];

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <>
      {/* Navigation */}
      <nav
        ref={navRef}
        style={{
          position: 'sticky',
          top: '0',
          zIndex: 1000,
          padding: isMobile ? '12px 0' : '16px 0',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--page-bg)',
        }}
      >
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 32px',
          width: '100%',
        }}>
          <div className="navPill" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '10px 16px' : '12px 24px',
            height: isMobile ? '52px' : '64px',
          }}>
            {/* Left: Logo */}
            <Link href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '14px',
              textDecoration: 'none',
              color: 'var(--text)',
            }}>
              {/* Logo Mark - center aligned with wordmark "O" optical baseline */}
              <svg 
                width={isMobile ? "26" : "32"} 
                height={isMobile ? "17" : "21"} 
                viewBox="0 0 180 120.85" 
                fill="currentColor"
              >
                <path d="M3.01,67.4H0v-13.94h3.01c6.02,0,10.94-4.92,10.94-10.94v-17.64C13.94,11.21,25.15,0,38.82,0h7.66v13.94h-7.66c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,6.97-3.01,13.4-7.66,17.91,4.65,4.51,7.66,10.94,7.66,17.91v17.64c0,6.01,4.92,10.94,10.94,10.94h7.66v13.94h-7.66c-13.67,0-24.88-11.21-24.88-24.88v-17.64c0-6.02-4.92-10.94-10.94-10.94Z"/>
                <path d="M159.77,60.42c-4.65-4.51-7.66-10.94-7.66-17.91v-17.64c0-6.02-4.92-10.94-10.94-10.94h-7.66V0h7.66c13.67,0,24.88,11.21,24.88,24.88v17.64c0,6.02,4.92,10.94,10.94,10.94h3.01v13.94h-3.01c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,13.67-11.21,24.88-24.88,24.88h-7.66v-13.94h7.66c6.02,0,10.94-4.92,10.94-10.94v-17.64c0-6.97,3.01-13.4,7.66-17.91Z"/>
                <path d="M51.38,53.6c.42-.49,1.29-1.22,2.59-2.17,1.3-.95,2.96-1.9,4.97-2.86,2.01-.95,4.36-1.78,7.04-2.49,2.68-.7,5.61-1.06,8.78-1.06s6.37.37,9.37,1.11c3,.74,5.66,1.96,7.99,3.65,2.33,1.69,4.18,3.91,5.56,6.67s2.06,6.14,2.06,10.16v31.43h-14.82l-1.27-6.03c-1.62,2.26-3.67,4.01-6.14,5.24-2.47,1.23-5.54,1.85-9.21,1.85-2.82,0-5.31-.41-7.46-1.22-2.15-.81-3.95-1.92-5.4-3.33-1.45-1.41-2.54-3.07-3.28-4.97-.74-1.91-1.11-3.95-1.11-6.14s.48-4.41,1.43-6.46c.95-2.04,2.47-3.83,4.55-5.34,2.08-1.52,4.78-2.73,8.1-3.65,3.32-.92,7.34-1.38,12.06-1.38h6.14v-.42c0-2.12-.76-3.77-2.28-4.98-1.52-1.2-4-1.8-7.46-1.8-1.55,0-3.05.21-4.5.64-1.45.42-2.75.92-3.92,1.48-1.16.57-2.17,1.15-3.02,1.75-.85.6-1.45,1.08-1.8,1.43l-8.99-11.11ZM83.34,75.82h-5.5c-3.53,0-5.96.65-7.3,1.96-1.34,1.31-2.01,2.77-2.01,4.39,0,1.2.46,2.33,1.38,3.39.92,1.06,2.4,1.59,4.45,1.59.85,0,1.8-.21,2.86-.63,1.06-.42,2.03-1.06,2.91-1.91.88-.85,1.64-1.92,2.28-3.23.63-1.3.95-2.8.95-4.5v-1.06Z"/>
                <path d="M106.94,32.22c0-1.55.28-3,.85-4.34.56-1.34,1.32-2.5,2.28-3.49.95-.99,2.08-1.76,3.39-2.33,1.3-.56,2.7-.85,4.18-.85s2.87.28,4.18.85c1.3.57,2.47,1.34,3.49,2.33,1.02.99,1.82,2.15,2.38,3.49.56,1.34.85,2.79.85,4.34s-.28,2.91-.85,4.29c-.57,1.38-1.36,2.56-2.38,3.54-1.02.99-2.19,1.78-3.49,2.38-1.31.6-2.7.9-4.18.9s-2.88-.3-4.18-.9c-1.31-.6-2.43-1.39-3.39-2.38-.95-.99-1.71-2.17-2.28-3.54-.57-1.38-.85-2.8-.85-4.29ZM108.95,46.19h17.46v51.86h-17.46v-51.86Z"/>
              </svg>
              {/* Wordmark - shifted down so "O" center aligns with pill center */}
              {!isMobile && (
                <svg 
                  width="108" 
                  height="19" 
                  viewBox="0 0 646.33 113.95" 
                  fill="currentColor"
                  style={{ transform: 'translateY(2px)' }}
                >
                  <path d="M0,46.47c0-5.52.99-10.74,2.98-15.64,1.98-4.9,4.79-9.17,8.41-12.79,3.62-3.62,7.92-6.48,12.9-8.58,4.98-2.1,10.47-3.15,16.46-3.15s11.48,1.05,16.46,3.15c4.98,2.1,9.26,4.96,12.84,8.58,3.58,3.62,6.36,7.88,8.35,12.79,1.99,4.9,2.98,10.12,2.98,15.64s-.99,10.61-2.98,15.47c-1.98,4.87-4.77,9.11-8.35,12.73-3.58,3.62-7.86,6.48-12.84,8.58-4.98,2.1-10.47,3.15-16.46,3.15s-11.48-1.05-16.46-3.15c-4.98-2.1-9.28-4.96-12.9-8.58-3.62-3.62-6.42-7.86-8.41-12.73-1.98-4.86-2.98-10.02-2.98-15.47ZM19.85,46.35c0,3.11.51,5.98,1.52,8.58,1.01,2.61,2.43,4.87,4.26,6.77,1.83,1.91,4.03,3.38,6.6,4.44,2.57,1.05,5.41,1.58,8.52,1.58s5.93-.53,8.46-1.58c2.53-1.05,4.71-2.53,6.54-4.44,1.83-1.91,3.25-4.16,4.26-6.77,1.01-2.61,1.52-5.47,1.52-8.58s-.51-5.97-1.52-8.58c-1.01-2.61-2.43-4.86-4.26-6.77-1.83-1.91-4.01-3.39-6.54-4.44-2.53-1.05-5.35-1.58-8.46-1.58s-5.95.53-8.52,1.58c-2.57,1.05-4.77,2.53-6.6,4.44-1.83,1.91-3.25,4.17-4.26,6.77-1.01,2.61-1.52,5.47-1.52,8.58Z"/>
                  <path d="M90.6.7h19.15v30.59c4.83-3.27,10.27-4.9,16.35-4.9,4.13,0,8,.78,11.62,2.34,3.62,1.56,6.77,3.68,9.46,6.36,2.69,2.68,4.81,5.84,6.36,9.46,1.56,3.62,2.33,7.49,2.33,11.62s-.78,8-2.33,11.62c-1.56,3.62-3.68,6.77-6.36,9.46-2.68,2.69-5.84,4.81-9.46,6.36-3.62,1.56-7.49,2.34-11.62,2.34-3.58,0-6.95-.58-10.1-1.75-3.15-1.17-6.01-2.76-8.58-4.79l-.47,5.37h-16.35V.7ZM136.72,56.16c0-1.87-.37-3.6-1.11-5.19-.74-1.59-1.71-3.02-2.92-4.26-1.21-1.25-2.63-2.22-4.26-2.92-1.63-.7-3.39-1.05-5.25-1.05s-3.6.35-5.2,1.05c-1.6.7-3.02,1.67-4.26,2.92-1.25,1.25-2.22,2.67-2.92,4.26-.7,1.6-1.05,3.33-1.05,5.19s.35,3.6,1.05,5.19c.7,1.6,1.67,3.02,2.92,4.26,1.24,1.25,2.67,2.22,4.26,2.92,1.59.7,3.33,1.05,5.2,1.05s3.62-.35,5.25-1.05c1.63-.7,3.05-1.67,4.26-2.92,1.21-1.24,2.18-2.67,2.92-4.26.74-1.59,1.11-3.33,1.11-5.19Z"/>
                  <path d="M185.63,27.55v60.01c0,3.74-.6,7.1-1.81,10.1-1.21,2.99-2.9,5.6-5.08,7.82-2.18,2.22-4.71,4.03-7.59,5.43-2.88,1.4-6.03,2.41-9.46,3.04l-5.37-12.96c2.96-1.56,5.37-3.29,7.24-5.2,1.87-1.91,2.8-4.65,2.8-8.23V27.55h19.26ZM164.15,12.14c0-1.71.31-3.31.93-4.79.62-1.48,1.5-2.76,2.63-3.85,1.13-1.09,2.41-1.94,3.85-2.57,1.44-.62,2.98-.93,4.61-.93s3.17.31,4.61.93c1.44.63,2.69,1.48,3.74,2.57,1.05,1.09,1.89,2.37,2.51,3.85.62,1.48.93,3.07.93,4.79s-.31,3.21-.93,4.73c-.62,1.52-1.46,2.82-2.51,3.91-1.05,1.09-2.3,1.96-3.74,2.63-1.44.66-2.98.99-4.61.99s-3.17-.33-4.61-.99c-1.44-.66-2.72-1.54-3.85-2.63-1.13-1.09-2.01-2.39-2.63-3.91-.62-1.52-.93-3.09-.93-4.73Z"/>
                  <path d="M250.31,78.34c-.86.78-2.1,1.63-3.74,2.57-1.63.93-3.54,1.79-5.72,2.57-2.18.78-4.55,1.42-7.12,1.93-2.57.5-5.18.76-7.82.76-4.44,0-8.52-.76-12.26-2.28-3.74-1.52-6.95-3.62-9.63-6.3-2.69-2.69-4.79-5.84-6.3-9.46-1.52-3.62-2.28-7.53-2.28-11.73s.76-8.11,2.28-11.73c1.52-3.62,3.62-6.77,6.3-9.46,2.68-2.68,5.9-4.79,9.63-6.3,3.74-1.52,7.82-2.28,12.26-2.28,4.75,0,9.01.76,12.78,2.28,3.77,1.52,6.99,3.6,9.63,6.25,2.64,2.65,4.69,5.78,6.13,9.4,1.44,3.62,2.16,7.53,2.16,11.73,0,1.01-.08,2.06-.23,3.15-.16,1.09-.31,2.1-.47,3.04l-40.75-.12c1.09,2.8,2.78,4.81,5.08,6.01,2.29,1.21,4.88,1.81,7.76,1.81,2.02,0,3.79-.19,5.31-.58,1.52-.39,2.8-.84,3.85-1.34,1.05-.51,1.89-1.01,2.51-1.52.62-.51,1.05-.88,1.28-1.11l9.34,12.73ZM237.35,51.6c-.16-2.57-1.13-4.77-2.92-6.6-1.79-1.83-4.36-2.74-7.71-2.74-2.96,0-5.51.76-7.65,2.28-2.14,1.52-3.6,3.87-4.38,7.06h22.65Z"/>
                  <path d="M322.93,70.17c-.86,2.34-2.16,4.46-3.91,6.36-1.75,1.91-3.81,3.54-6.19,4.9-2.37,1.36-5,2.41-7.88,3.15-2.88.74-5.92,1.11-9.11,1.11-4.59,0-8.84-.72-12.73-2.16-3.89-1.44-7.24-3.48-10.04-6.13-2.8-2.64-5-5.78-6.6-9.4-1.6-3.62-2.39-7.57-2.39-11.85s.8-8.33,2.39-11.91c1.59-3.58,3.79-6.69,6.6-9.34,2.8-2.64,6.15-4.69,10.04-6.13,3.89-1.44,8.13-2.16,12.73-2.16,3.19,0,6.23.37,9.11,1.11,2.88.74,5.51,1.79,7.88,3.15,2.37,1.36,4.44,3,6.19,4.9,1.75,1.91,3.05,4.03,3.91,6.36l-14.94,7.35c-1.01-2.02-2.59-3.68-4.73-4.96-2.14-1.28-4.5-1.93-7.06-1.93-1.87,0-3.62.35-5.25,1.05-1.63.7-3.06,1.65-4.26,2.86-1.21,1.21-2.16,2.63-2.86,4.26-.7,1.64-1.05,3.39-1.05,5.25s.35,3.74,1.05,5.37c.7,1.64,1.65,3.08,2.86,4.32,1.21,1.25,2.63,2.22,4.26,2.92,1.64.7,3.39,1.05,5.25,1.05,2.57,0,4.92-.64,7.06-1.93,2.14-1.28,3.72-2.94,4.73-4.96l14.94,7.36Z"/>
                  <path d="M335.54,27.55l4.09-15.18h15.18v15.18h15.06v15.18h-15.06v17.98c0,3.27.54,5.62,1.64,7.06,1.09,1.44,2.92,2.16,5.49,2.16,1.09,0,2.28-.12,3.56-.35,1.28-.24,2.74-.55,4.38-.94v15.18c-5.22,1.4-10.08,2.1-14.59,2.1-5.84,0-10.59-1.36-14.24-4.09-3.66-2.72-5.49-7.16-5.49-13.31v-25.8h-8.17v-15.18h8.17Z"/>
                  <path d="M379.2,12.14c0-1.71.31-3.31.93-4.79.62-1.48,1.46-2.76,2.51-3.85,1.05-1.09,2.29-1.94,3.74-2.57,1.44-.62,2.98-.93,4.61-.93s3.17.31,4.61.93c1.44.63,2.72,1.48,3.85,2.57,1.13,1.09,2,2.37,2.63,3.85.62,1.48.93,3.07.93,4.79s-.31,3.21-.93,4.73c-.62,1.52-1.5,2.82-2.63,3.91-1.13,1.09-2.41,1.96-3.85,2.63-1.44.66-2.98.99-4.61.99s-3.17-.33-4.61-.99c-1.44-.66-2.68-1.54-3.74-2.63s-1.89-2.39-2.51-3.91c-.62-1.52-.93-3.09-.93-4.73ZM381.42,27.55h19.26v57.21h-19.26V27.55Z"/>
                  <path d="M430.93,27.55l9.69,36.54h.23l9.81-36.54h21.72l-20.2,57.21h-22.88l-20.08-57.21h21.72Z"/>
                  <path d="M527.83,78.34c-.86.78-2.1,1.63-3.74,2.57-1.63.93-3.54,1.79-5.72,2.57-2.18.78-4.55,1.42-7.12,1.93-2.57.5-5.18.76-7.82.76-4.44,0-8.52-.76-12.26-2.28-3.74-1.52-6.95-3.62-9.63-6.3-2.69-2.69-4.79-5.84-6.3-9.46-1.52-3.62-2.28-7.53-2.28-11.73s.76-8.11,2.28-11.73c1.52-3.62,3.62-6.77,6.3-9.46,2.68-2.68,5.9-4.79,9.63-6.3s7.82-2.28,12.26-2.28c4.75,0,9.01.76,12.78,2.28,3.77,1.52,6.99,3.6,9.63,6.25,2.64,2.65,4.69,5.78,6.13,9.4,1.44,3.62,2.16,7.53,2.16,11.73,0,1.01-.08,2.06-.23,3.15-.16,1.09-.31,2.1-.47,3.04l-40.75-.12c1.09,2.8,2.78,4.81,5.08,6.01,2.29,1.21,4.88,1.81,7.76,1.81,2.02,0,3.79-.19,5.31-.58,1.52-.39,2.8-.84,3.85-1.34,1.05-.51,1.89-1.01,2.51-1.52.62-.51,1.05-.88,1.28-1.11l9.34,12.73ZM514.87,51.6c-.16-2.57-1.13-4.77-2.92-6.6-1.79-1.83-4.36-2.74-7.71-2.74-2.96,0-5.51.76-7.65,2.28-2.14,1.52-3.6,3.87-4.38,7.06h22.65Z"/>
                  <path d="M565.89,7.94h22.77l28.6,76.82h-21.72l-4.55-12.26h-27.44l-4.55,12.26h-21.72l28.6-76.82ZM569.51,56.16h15.53l-7.59-25.33h-.23l-7.71,25.33Z"/>
                  <path d="M646.33,84.76h-19.85V7.94h19.85v76.82Z"/>
                </svg>
              )}
            </Link>

            {/* Center: Nav Links (Desktop) */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                {navLinks.map(link => (
                  <div
                    key={link.href}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => link.subLinks && link.subLinks.length > 1 && setOpenDropdown(link.href)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={`navLink ${isActive(link.href) ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {link.label}
                      {link.subLinks && link.subLinks.length > 1 && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            opacity: 0.5,
                            transform: openDropdown === link.href ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </Link>
                    {/* Dropdown */}
                    {link.subLinks && link.subLinks.length > 1 && openDropdown === link.href && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        paddingTop: '8px',
                        zIndex: 100,
                      }}>
                        <div style={{
                          background: 'var(--card-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '8px',
                          minWidth: '140px',
                          boxShadow: '0 4px 20px var(--shadow)',
                        }}>
                          {link.subLinks.map(sub => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setOpenDropdown(null)}
                              style={{
                                display: 'block',
                                padding: '8px 12px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: pathname === sub.href ? 'var(--accent)' : 'var(--text)',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--border)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Right: Discord, Theme Toggle, Profile, Hamburger */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '10px' : '20px',
            }}>
              {/* Discord Button - adapts to theme (hidden on mobile) */}
              {!isMobile && (
                <a
                  href="https://discord.gg/gbNFHensby"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: 1,
                    color: 'var(--btn-solid-text)',
                    background: 'var(--btn-solid-bg)',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateY(2px)',
                    textDecoration: 'none',
                  }}
                >
                  Discord
                </a>
              )}

              {/* Toggle + Profile Group */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '10px' : '12px',
                transform: 'translateY(2px)',
              }}>
                {/* Theme Toggle */}
                {mounted && (
                  <button
                    onClick={toggleTheme}
                    style={{
                      width: isMobile ? '48px' : '56px',
                      height: isMobile ? '28px' : '30px',
                      background: theme === 'dark' ? 'var(--accent)' : 'var(--border)',
                      border: 'none',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                    aria-label="Toggle theme"
                  >
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: theme === 'dark' ? (isMobile ? '23px' : '29px') : '3px',
                      width: isMobile ? '22px' : '24px',
                      height: isMobile ? '22px' : '24px',
                      background: 'var(--color-light)',
                      borderRadius: '12px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(27, 27, 27, 0.2)',
                    }} />
                  </button>
                )}

                {/* User Menu */}
                <UserMenu
                  isMobile={isMobile}
                  forceClose={mobileMenuOpen}
                  onOpen={() => setMobileMenuOpen(false)}
                />
              </div>

              {/* Hamburger Menu (Mobile) */}
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '36px',
                    height: '36px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    gap: '5px',
                  }}
                >
                  <span style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--text)',
                    borderRadius: '1px',
                    transition: 'all 0.3s',
                    transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                  }} />
                  <span style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--text)',
                    borderRadius: '1px',
                    transition: 'all 0.3s',
                    opacity: mobileMenuOpen ? 0 : 1,
                  }} />
                  <span style={{
                    display: 'block',
                    width: '20px',
                    height: '2px',
                    background: 'var(--text)',
                    borderRadius: '1px',
                    transition: 'all 0.3s',
                    transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                  }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown - horizontal layout like footer */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            padding: '8px 16px 12px',
            zIndex: 999,
          }}>
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 20px var(--shadow)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                {navLinks.map((link) => (
                  <div key={link.href} style={{ flex: 1 }}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: isActive(link.href) ? 'var(--accent)' : 'var(--text-muted)',
                        textDecoration: 'none',
                        marginBottom: '6px',
                      }}
                    >
                      {link.label}
                    </Link>
                    {link.subLinks && link.subLinks.length > 1 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}>
                        {link.subLinks.map(sub => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                              display: 'block',
                              fontSize: '13px',
                              fontWeight: 400,
                              color: pathname === sub.href ? 'var(--accent)' : 'var(--text)',
                              textDecoration: 'none',
                            }}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Discord Button for Mobile */}
              <a
                href="https://discord.gg/gbNFHensby"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--btn-solid-text)',
                  background: 'var(--btn-solid-bg)',
                  border: 'none',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  alignSelf: 'flex-start',
                }}
              >
                <svg width="16" height="12" viewBox="0 0 24 18" fill="currentColor">
                  <path d="M20.317 1.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 0c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 12.278c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.068-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.947 2.38-2.157 2.38z" />
                </svg>
                Discord
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
