"use client";

import { useState } from "react";
import Link from "next/link";
import { GitHubIcon, DiscordIcon, XIcon, LinkedInIcon, YouTubeIcon } from "./SocialIcons";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Footer() {
  const isMobile = useIsMobile();
  const [contactEmail, setContactEmail] = useState("");

  const socialIcons = [
    { name: "GitHub", href: "https://github.com/ObjectiveAI/objectiveai", icon: <GitHubIcon /> },
    { name: "Discord", href: "https://discord.gg/gbNFHensby", icon: <DiscordIcon /> },
    { name: "X", href: "https://x.com/objectv_ai", icon: <XIcon /> },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/objective-ai", icon: <LinkedInIcon /> },
    { name: "YouTube", href: "https://www.youtube.com/@Objective-AI", icon: <YouTubeIcon /> },
  ];

  return (
    <footer className="footer" style={{ padding: isMobile ? '24px 0 6px' : '32px 0 6px' }}>
      {/* Footer Module Container */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0 32px',
      }}>
        <div style={{
          padding: isMobile ? '8px 16px 4px' : '12px 24px 4px',
        }}>
          {/* ROW 1: Menu + Socials on same row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: isMobile ? '20px' : '28px',
            gap: '48px',
          }} className="footerMenuSocialRow">
            {/* Pages Menu (3 groups) - CENTERED */}
            <nav style={{
              display: 'flex',
              gap: '72px',
              justifyContent: 'center',
            }} className="footerPageMenu">
              {/* GROUP 1: FUNCTIONS */}
              <div style={{ textAlign: 'left' }}>
                <Link href="/functions" className="footerGroupTitle">
                  Functions
                </Link>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <Link href="/functions" className="footerLink">Browse</Link>
                  <Link href="/functions/create" className="footerLink">Create</Link>
                  <Link href="/profiles" className="footerLink">Profiles</Link>
                  <Link href="/profiles/train" className="footerLink">Train</Link>
                </div>
              </div>

              {/* GROUP 2: ENSEMBLES */}
              <div style={{ textAlign: 'left' }}>
                <Link href="/ensembles" className="footerGroupTitle">
                  Ensembles
                </Link>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <Link href="/ensembles" className="footerLink">Browse</Link>
                  <Link href="/ensembles/create" className="footerLink">Create</Link>
                  <Link href="/ensemble-llms" className="footerLink">LLMs</Link>
                  <Link href="/ensemble-llms/create" className="footerLink">Create LLM</Link>
                </div>
              </div>

              {/* GROUP 3: FREEFORM */}
              <div style={{ textAlign: 'left' }}>
                <Link href="/sdk-first" className="footerGroupTitle">
                  Freeform
                </Link>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <Link href="/sdk-first" className="footerLink">SDK-First</Link>
                  <Link href="/vibe-native" className="footerLink">Vibe-Native</Link>
                  <Link href="/chat" className="footerLink">Chat</Link>
                  <Link href="/vector" className="footerLink">Vector</Link>
                </div>
              </div>

              {/* GROUP 4: INFORMATION */}
              <div style={{ textAlign: 'left' }}>
                <Link href="/information" className="footerGroupTitle">
                  Information
                </Link>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}>
                  <Link href="/people" className="footerLink">Team</Link>
                  <Link href="/docs" className="footerLink">API Docs</Link>
                  <Link href="/information" className="footerLink">Info</Link>
                  <Link href="/legal" className="footerLink">Legal</Link>
                </div>
              </div>
            </nav>

            {/* Social Icons - RIGHT */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '12px' : '20px',
              alignItems: 'flex-start',
              flexShrink: 0,
              paddingRight: isMobile ? '0' : '8px',
            }} className="footerSocialStrip">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="footerSocialIcon"
                  style={{
                    width: isMobile ? '36px' : '40px',
                    height: isMobile ? '36px' : '40px',
                    fontSize: isMobile ? '12px' : '14px',
                  }}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ROW 2: Support Bar */}
          <div style={{
            paddingTop: isMobile ? '4px' : '8px',
            marginBottom: isMobile ? '20px' : '28px',
          }} className="footerSupportBar">
            <label
              htmlFor="footer-email"
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                opacity: 0.7,
              }}
            >
              Support & Inquiries
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (contactEmail.trim()) {
                  window.location.href = `mailto:admin@objective-ai.io?subject=${encodeURIComponent("Support Inquiry")}&body=${encodeURIComponent(`Contact email: ${contactEmail.trim()}\n\n`)}`;
                }
              }}
            >
              <div className="humanTextField" style={{ maxWidth: '100%' }}>
                <input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
                <button type="submit" aria-label="Send">
                  <svg
                    className="arrowIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* ROW 3: Identity */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }} className="footerIdentity">
            {/* Logo Mark - aligned with "O" in Objective */}
            <svg
              width="20"
              height="13"
              viewBox="0 0 180 120.85"
              fill="currentColor"
              style={{ opacity: 0.5 }}
            >
              <path d="M3.01,67.4H0v-13.94h3.01c6.02,0,10.94-4.92,10.94-10.94v-17.64C13.94,11.21,25.15,0,38.82,0h7.66v13.94h-7.66c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,6.97-3.01,13.4-7.66,17.91,4.65,4.51,7.66,10.94,7.66,17.91v17.64c0,6.01,4.92,10.94,10.94,10.94h7.66v13.94h-7.66c-13.67,0-24.88-11.21-24.88-24.88v-17.64c0-6.02-4.92-10.94-10.94-10.94Z"/>
              <path d="M159.77,60.42c-4.65-4.51-7.66-10.94-7.66-17.91v-17.64c0-6.02-4.92-10.94-10.94-10.94h-7.66V0h7.66c13.67,0,24.88,11.21,24.88,24.88v17.64c0,6.02,4.92,10.94,10.94,10.94h3.01v13.94h-3.01c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,13.67-11.21,24.88-24.88,24.88h-7.66v-13.94h7.66c6.02,0,10.94-4.92,10.94-10.94v-17.64c0-6.97,3.01-13.4,7.66-17.91Z"/>
              <path d="M51.38,53.6c.42-.49,1.29-1.22,2.59-2.17,1.3-.95,2.96-1.9,4.97-2.86,2.01-.95,4.36-1.78,7.04-2.49,2.68-.7,5.61-1.06,8.78-1.06s6.37.37,9.37,1.11c3,.74,5.66,1.96,7.99,3.65,2.33,1.69,4.18,3.91,5.56,6.67s2.06,6.14,2.06,10.16v31.43h-14.82l-1.27-6.03c-1.62,2.26-3.67,4.01-6.14,5.24-2.47,1.23-5.54,1.85-9.21,1.85-2.82,0-5.31-.41-7.46-1.22-2.15-.81-3.95-1.92-5.4-3.33-1.45-1.41-2.54-3.07-3.28-4.97-.74-1.91-1.11-3.95-1.11-6.14s.48-4.41,1.43-6.46c.95-2.04,2.47-3.83,4.55-5.34,2.08-1.52,4.78-2.73,8.1-3.65,3.32-.92,7.34-1.38,12.06-1.38h6.14v-.42c0-2.12-.76-3.77-2.28-4.98-1.52-1.2-4-1.8-7.46-1.8-1.55,0-3.05.21-4.5.64-1.45.42-2.75.92-3.92,1.48-1.16.57-2.17,1.15-3.02,1.75-.85.6-1.45,1.08-1.8,1.43l-8.99-11.11ZM83.34,75.82h-5.5c-3.53,0-5.96.65-7.3,1.96-1.34,1.31-2.01,2.77-2.01,4.39,0,1.2.46,2.33,1.38,3.39.92,1.06,2.4,1.59,4.45,1.59.85,0,1.8-.21,2.86-.63,1.06-.42,2.03-1.06,2.91-1.91.88-.85,1.64-1.92,2.28-3.23.63-1.3.95-2.8.95-4.5v-1.06Z"/>
              <path d="M106.94,32.22c0-1.55.28-3,.85-4.34.56-1.34,1.32-2.5,2.28-3.49.95-.99,2.08-1.76,3.39-2.33,1.3-.56,2.7-.85,4.18-.85s2.87.28,4.18.85c1.3.57,2.47,1.34,3.49,2.33,1.02.99,1.82,2.15,2.38,3.49.56,1.34.85,2.79.85,4.34s-.28,2.91-.85,4.29c-.57,1.38-1.36,2.56-2.38,3.54-1.02.99-2.19,1.78-3.49,2.38-1.31.6-2.7.9-4.18.9s-2.88-.3-4.18-.9c-1.31-.6-2.43-1.39-3.39-2.38-.95-.99-1.71-2.17-2.28-3.54-.57-1.38-.85-2.8-.85-4.29ZM108.95,46.19h17.46v51.86h-17.46v-51.86Z"/>
            </svg>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.01em',
              opacity: 0.6,
            }}>
              Objective Artificial Intelligence, 2025–2026
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .footerPageMenu {
            gap: 48px !important;
          }
        }

        @media (max-width: 640px) {
          .footerMenuSocialRow {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }

          .footerSocialStrip {
            justify-content: space-between !important;
            width: 100% !important;
          }

          .footerPageMenu {
            flex-direction: row !important;
            gap: 0 !important;
            justify-content: space-between !important;
          }
        }
      `}</style>
    </footer>
  );
}
