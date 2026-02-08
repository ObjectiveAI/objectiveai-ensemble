"use client";

import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function LegalPage() {
  const isMobile = useIsMobile();
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const sectionStyle = {
    marginBottom: '24px',
  };

  const headingStyle = {
    fontSize: isMobile ? '16px' : '17px',
    fontWeight: 600 as const,
    marginBottom: '10px',
    color: 'var(--text)',
  };

  const paragraphStyle = {
    fontSize: isMobile ? '14px' : '15px',
    color: 'var(--text)',
    lineHeight: 1.7,
    marginBottom: '10px',
  };

  const listStyle = {
    fontSize: isMobile ? '14px' : '15px',
    color: 'var(--text)',
    lineHeight: 1.7,
    marginLeft: '20px',
    marginBottom: '10px',
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '48px',
        }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            Legal
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Terms, policies, and legal information for ObjectiveAI.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Terms of Service Card */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => setTermsOpen(!termsOpen)}
          >
            <div
              style={{
                padding: isMobile ? '16px' : '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div>
                <h3 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--text)',
                }}>
                  Terms of Service
                </h3>
                <p style={{
                  fontSize: isMobile ? '14px' : '15px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  Terms and conditions for using ObjectiveAI services and API
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: termsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {termsOpen && (
              <div style={{
                padding: isMobile ? '0 16px 16px' : '0 24px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: '8px',
                paddingTop: isMobile ? '16px' : '20px',
              }}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}>
                  Last Updated: October 18th, 2025
                </p>

                <div style={sectionStyle}>
                  <p style={paragraphStyle}>
                    Welcome to Objective Artificial Intelligence, Inc. (&ldquo;ObjectiveAI,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of our API and website (together, the &ldquo;Service&rdquo;). Please read them carefully. By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use the Service.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>1. Services Overview</h4>
                  <p style={paragraphStyle}>
                    ObjectiveAI provides access to artificial intelligence models through our API and website. We may update, modify, suspend, or discontinue any part of the Service at any time without liability.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>2. Eligibility</h4>
                  <p style={paragraphStyle}>
                    You must be at least 18 years of age to use the Service. By using the Service, you represent that you meet this requirement and that your use of the Service complies with all applicable laws.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>3. Accounts and Authentication</h4>
                  <p style={paragraphStyle}>
                    We use third-party authentication providers. We do not store emails or passwords. You are responsible for maintaining the security of your external authentication credentials. We are not responsible for any unauthorized access resulting from compromised credentials.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>4. Credits and Payments</h4>
                  <p style={paragraphStyle}>
                    Access to the Service requires the purchase of credits.
                  </p>
                  <ul style={listStyle}>
                    <li><strong>Purchases:</strong> Credits are purchased through Stripe, our third-party payment processor.</li>
                    <li><strong>Refunds:</strong> Refunds are available only within 24 hours of purchase and only if your account still has the purchased balance available. Partial refunds are not offered. To request a refund, contact us at <a href="mailto:admin@objective-ai.io" style={{ color: 'var(--accent)', textDecoration: 'none' }}>admin@objective-ai.io</a>.</li>
                    <li><strong>Expiration:</strong> Credits do not currently expire.</li>
                    <li><strong>No Subscriptions:</strong> We do not offer subscription plans at this time.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>5. User Content (Inputs and Outputs)</h4>
                  <ul style={listStyle}>
                    <li><strong>Ownership:</strong> You retain ownership of all inputs and outputs you generate using the Service.</li>
                    <li><strong>Rights Reserved:</strong> By using the Service, you grant ObjectiveAI the right to store and process your inputs and outputs in order to provide and improve the Service.</li>
                    <li><strong>Model Improvement:</strong> We reserve the right to use stored data for model improvement.</li>
                    <li><strong>Upstream Providers:</strong> Requests may be routed to upstream AI providers. By using the Service, you agree to the applicable terms of those providers. Users may configure providers that do not store data if they wish to avoid upstream storage.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>6. Acceptable Use</h4>
                  <p style={paragraphStyle}>
                    You may not use the Service for illegal, harmful, or fraudulent purposes. You are solely responsible for your activity when using the Service.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>7. Service Availability</h4>
                  <p style={paragraphStyle}>
                    We strive to maintain reliable access but do not guarantee uptime. Service availability may depend on upstream providers. The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>8. Intellectual Property</h4>
                  <p style={paragraphStyle}>
                    ObjectiveAI retains all rights, title, and interest in and to its technology, branding, and services. Your use of the Service does not grant you any ownership of our intellectual property.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>9. Disclaimers and Limitation of Liability</h4>
                  <ul style={listStyle}>
                    <li><strong>Disclaimers:</strong> The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied, including fitness for a particular purpose or non-infringement.</li>
                    <li><strong>Liability Cap:</strong> To the maximum extent permitted by law, ObjectiveAI&apos;s total liability for any claim is limited to the greater of: (a) the amount you paid us in the 12 months prior to the event giving rise to the claim, or (b) $100.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>10. Termination</h4>
                  <ul style={listStyle}>
                    <li><strong>By You:</strong> You may stop using the Service at any time.</li>
                    <li><strong>By Us:</strong> We may suspend or terminate your access at any time, including for violations of these Terms. In such cases, we will refund your remaining purchased credit balance.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>11. Feedback</h4>
                  <p style={paragraphStyle}>
                    If you provide us with feedback, suggestions, or ideas, you grant us a perpetual, royalty-free right to use them without restriction or compensation.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>12. Governing Law and Dispute Resolution</h4>
                  <p style={paragraphStyle}>
                    These Terms are governed by the laws of the State of Delaware. Any disputes will be resolved through binding arbitration on an individual basis. You waive the right to participate in class actions or class-wide arbitration.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>13. Changes to These Terms</h4>
                  <p style={paragraphStyle}>
                    We may update these Terms from time to time. Updated versions will be posted on our website with a new &ldquo;Last Updated&rdquo; date. Continued use of the Service after updates constitutes acceptance of the revised Terms.
                  </p>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <h4 style={headingStyle}>14. Contact Us</h4>
                  <p style={{ ...paragraphStyle, marginBottom: 0 }}>
                    If you have questions about these Terms, please email us at{' '}
                    <a
                      href="mailto:admin@objective-ai.io"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      admin@objective-ai.io
                    </a>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Policy Card */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => setPrivacyOpen(!privacyOpen)}
          >
            <div
              style={{
                padding: isMobile ? '16px' : '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div>
                <h3 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: 'var(--text)',
                }}>
                  Privacy Policy
                </h3>
                <p style={{
                  fontSize: isMobile ? '14px' : '15px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  How we collect, use, and protect your personal information
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: privacyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {privacyOpen && (
              <div style={{
                padding: isMobile ? '0 16px 16px' : '0 24px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: '8px',
                paddingTop: isMobile ? '16px' : '20px',
              }}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}>
                  Last Updated: October 18th, 2025
                </p>

                <div style={sectionStyle}>
                  <p style={paragraphStyle}>
                    Objective Artificial Intelligence, Inc. (&ldquo;ObjectiveAI,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our API and website (together, the &ldquo;Service&rdquo;). By using our Service, you agree to the practices described in this policy. If you do not agree, you may not use the Service.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>1. Information We Collect</h4>
                  <ul style={listStyle}>
                    <li><strong>Account Data:</strong> We do not store emails or passwords. We use external authentication providers and store only the user IDs from those tokens.</li>
                    <li><strong>Billing Data:</strong> Billing information is handled by Stripe. Stripe stores and processes this data; we do not retain it.</li>
                    <li><strong>Usage Data:</strong> We log all requests and responses to and from the API, including those made via the website client. Users may retrieve their own historical chats. We may display anonymized statistics (e.g., number of tokens, request counts) but never expose user inputs or outputs to other parties without user consent.</li>
                    <li><strong>Technical Data:</strong> We may collect device information, IP addresses, and log data to secure and operate the Service.</li>
                    <li><strong>No Sensitive Data:</strong> We do not collect government IDs, health data, or other special categories of personal information.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>2. How We Use Information</h4>
                  <p style={paragraphStyle}>
                    We use collected data to:
                  </p>
                  <ul style={listStyle}>
                    <li>Provide and maintain the Service</li>
                    <li>Secure the Service and authenticate access</li>
                    <li>Monitor usage and generate anonymized statistics</li>
                    <li>Improve models and services (we reserve this right)</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                  <p style={paragraphStyle}>
                    We do not share data for marketing purposes.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>3. Sharing and Disclosure</h4>
                  <ul style={listStyle}>
                    <li><strong>Service Providers:</strong> We use third-party providers (e.g., cloud infrastructure, upstream LLM APIs, Stripe) who may process limited data on our behalf.</li>
                    <li><strong>Statistics:</strong> We may share non-sensitive, aggregated usage statistics.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect rights, property, or safety.</li>
                    <li><strong>No Sale of Data:</strong> We do not sell personal data.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>4. Data Security</h4>
                  <p style={paragraphStyle}>
                    We use authentication, encryption, and access controls to protect stored data. While no method of transmission or storage is fully secure, we take reasonable steps to safeguard your information.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>5. Data Retention</h4>
                  <ul style={listStyle}>
                    <li>Usage data (including inputs/outputs and stats) may be retained indefinitely.</li>
                    <li>Because we use external authentication, we do not maintain standalone user accounts and therefore do not currently provide account closure or deletion functionality.</li>
                  </ul>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>6. Your Rights</h4>
                  <p style={paragraphStyle}>
                    Depending on your location, you may have rights under laws such as the GDPR and CCPA:
                  </p>
                  <ul style={listStyle}>
                    <li>Access your data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of data (subject to limitations)</li>
                    <li>Request a copy of your data in portable format</li>
                    <li>Object to certain processing</li>
                    <li>Restrict processing in certain circumstances</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>
                  <p style={paragraphStyle}>
                    To exercise these rights, email us at{' '}
                    <a
                      href="mailto:admin@objective-ai.io"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      admin@objective-ai.io
                    </a>. We may require verification of your identity.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>7. International Data Transfers</h4>
                  <p style={paragraphStyle}>
                    All data is stored and processed in the United States. By using the Service, you consent to this transfer and storage.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>8. Eligibility</h4>
                  <p style={paragraphStyle}>
                    Our Service is intended for users 18 years of age and older.
                  </p>
                </div>

                <div style={sectionStyle}>
                  <h4 style={headingStyle}>9. Changes</h4>
                  <p style={paragraphStyle}>
                    We may update this Privacy Policy from time to time. Updates will be posted on this page with a new &ldquo;Last Updated&rdquo; date. Continued use of the Service means you accept the updated policy.
                  </p>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <h4 style={headingStyle}>10. Contact</h4>
                  <p style={{ ...paragraphStyle, marginBottom: 0 }}>
                    If you have questions about this Privacy Policy, email us at{' '}
                    <a
                      href="mailto:admin@objective-ai.io"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      admin@objective-ai.io
                    </a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '48px' : '64px',
          padding: '24px',
          borderTop: '1px solid var(--border)',
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            Questions about our legal policies? Contact us at{' '}
            <a
              href="mailto:admin@objective-ai.io"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              admin@objective-ai.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
