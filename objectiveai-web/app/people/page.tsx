"use client";

import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { EMAIL_SENT_FEEDBACK_DURATION_MS } from "../../lib/constants";

// Types for team member data
interface SocialLinks {
  x?: string;
  linkedin?: string;
  github?: string;
}

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  focusAreas: string[];
  contactEmail: string;
  photoUrl?: string;
  socials: SocialLinks;
}

// Founders data - these are the co-founders displayed side by side
const FOUNDERS: TeamMember[] = [
  {
    id: "ceo",
    name: "Ronald Riggles",
    title: "CEO & Co-Founder",
    bio: "Building the infrastructure for objective AI evaluation. Previously worked on distributed systems and machine learning pipelines. Passionate about making AI more transparent and accountable through ensemble methods.",
    focusAreas: ["Software Engineer", "Programmer", "AI Architect"],
    contactEmail: "", // Removed for now
    photoUrl: "/photos/ronald.jpg",
    socials: {
      x: "https://x.com/ronald_obj_ai",
      linkedin: "https://www.linkedin.com/in/ronald-riggles-908a29235/",
      github: "https://github.com/WiggidyW",
    },
  },
  {
    id: "coo",
    name: "Maya Gore",
    title: "COO & Co-Founder",
    bio: "Designing experiences that make complex AI systems feel intuitive. Background in product design and creative technology. Believes great tools should be invisible, letting users focus on what matters.",
    focusAreas: ["User Interface", "Creative Direction", "Vibe Coder"],
    contactEmail: "", // Removed for now
    photoUrl: "/photos/maya.jpg",
    socials: {
      x: "https://x.com/mkgores",
      linkedin: "https://www.linkedin.com/in/maya-gore-4ab87b301/",
      github: "https://github.com/mayagore",
    },
  },
];

// Social icon components
const SocialIcons = {
  x: (
    <svg width="14" height="14" viewBox="0 0 1200 1227" fill="currentColor">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  github: (
    <svg width="14" height="14" viewBox="0 0 98 96" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
    </svg>
  ),
};

// Person Card Component
function PersonCard({ person, isMobile }: { person: TeamMember; isMobile: boolean }) {
  return (
    <div
      className="card"
      style={{
        flex: 1,
        minWidth: isMobile ? '100%' : '340px',
        maxWidth: isMobile ? '100%' : '520px',
        padding: isMobile ? '20px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '16px' : '20px',
      }}
    >
      {/* Profile Header: Photo + Info */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '16px' : '20px',
        alignItems: 'center',
      }}>
        {/* Circle Photo */}
        <div style={{
          width: isMobile ? '90px' : '110px',
          height: isMobile ? '90px' : '110px',
          flexShrink: 0,
          borderRadius: '50%',
          background: 'var(--nav-surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
          overflow: 'hidden',
        }}>
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt={person.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{
              fontSize: isMobile ? '28px' : '32px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              opacity: 0.6,
            }}>
              {person.name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>

        {/* Name, Title, Tags - vertically centered with circle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 700,
            marginBottom: '3px',
            color: 'var(--text)',
            lineHeight: 1.2,
          }}>
            {person.name}
          </h3>
          <p style={{
            fontSize: isMobile ? '12px' : '13px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            marginBottom: isMobile ? '6px' : '8px',
            lineHeight: 1.3,
          }}>
            {person.title}
          </p>
          {/* Focus Areas */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}>
            {person.focusAreas.map((area) => (
              <span
                key={area}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 500,
                  background: 'var(--nav-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  color: 'var(--text-muted)',
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio - only show if not empty */}
      {person.bio && (
        <p style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--text)',
          opacity: 0.85,
        }}>
          {person.bio}
        </p>
      )}

      {/* Socials Row */}
      <div style={{
        display: 'flex',
        justifyContent: person.contactEmail ? 'space-between' : 'flex-end',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: '4px',
      }}>
        {/* Contact Link - only show if email exists */}
        {person.contactEmail && (
          <a
            href={`mailto:${person.contactEmail}`}
            style={{
              fontSize: '13px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Contact
          </a>
        )}

        {/* Social Icons */}
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          {person.socials.x && (
            <SocialIconLink href={person.socials.x} label="X" icon={SocialIcons.x} />
          )}
          {person.socials.linkedin && (
            <SocialIconLink href={person.socials.linkedin} label="LinkedIn" icon={SocialIcons.linkedin} />
          )}
          {person.socials.github && (
            <SocialIconLink href={person.socials.github} label="GitHub" icon={SocialIcons.github} />
          )}
        </div>
      </div>
    </div>
  );
}

// Social Icon Link Component
function SocialIconLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--card-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        textDecoration: 'none',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'rgba(107, 92, 255, 0.05)';
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--card-bg)';
        e.currentTarget.style.color = 'var(--text-muted)';
      }}
    >
      {icon}
    </a>
  );
}

export default function PeoplePage() {
  const isMobile = useIsMobile();
  const [emailSent, setEmailSent] = useState(false);

  const handleJoinSubmit = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), EMAIL_SENT_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Page Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '40px',
        }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            Co-Founders
          </h1>
          <p style={{
            fontSize: isMobile ? '15px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            The Developer & The Designer
          </p>
        </div>

        {/* Founders Section */}
        <section style={{ marginBottom: isMobile ? '32px' : '40px' }}>
          <div className="gridTwo">
            {FOUNDERS.map((founder) => (
              <PersonCard key={founder.id} person={founder} isMobile={isMobile} />
            ))}
          </div>
        </section>

        {/* Join the Team Section */}
        <section>
          <div
            className="card"
            style={{
              padding: isMobile ? '28px 20px' : '48px',
              textAlign: 'center',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>
              Careers
            </span>
            <h2 className="heading2" style={{ marginBottom: '12px' }}>
              Join the Team
            </h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              maxWidth: '450px',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}>
              We&apos;re always looking for talented people who share our vision. 
              Get in touch to explore opportunities.
            </p>
            
            {/* Email Input */}
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div className="humanTextField">
                <input
                  type="email"
                  placeholder="you@email.com"
                  style={{ width: '100%' }}
                />
                <button onClick={handleJoinSubmit} aria-label="Send">
                  <svg 
                    className={`arrowIcon ${emailSent ? 'sent' : ''}`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '16px',
              opacity: 0.6,
            }}>
              Or reach out directly at{' '}
              <a 
                href="mailto:admin@objective-ai.io"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}
              >
                admin@objective-ai.io
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
