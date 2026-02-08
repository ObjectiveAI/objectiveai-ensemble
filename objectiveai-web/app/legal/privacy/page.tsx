"use client";

import Link from "next/link";

export default function PrivacyPage() {
  const sectionStyle = {
    marginBottom: '32px',
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: 600 as const,
    marginBottom: '12px',
    color: 'var(--text)',
  };

  const paragraphStyle = {
    fontSize: '15px',
    color: 'var(--text)',
    lineHeight: 1.7,
    marginBottom: '12px',
  };

  const listStyle = {
    fontSize: '15px',
    color: 'var(--text)',
    lineHeight: 1.7,
    marginLeft: '24px',
    marginBottom: '12px',
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Last Updated: October 18th, 2025
          </p>
        </div>

        {/* Content */}
        <div>
          <div style={sectionStyle}>
            <p style={paragraphStyle}>
              Objective Artificial Intelligence, Inc. (&ldquo;ObjectiveAI,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our API and website (together, the &ldquo;Service&rdquo;). By using our Service, you agree to the practices described in this policy. If you do not agree, you may not use the Service.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>1. Information We Collect</h2>
            <ul style={listStyle}>
              <li><strong>Account Data:</strong> We do not store emails or passwords. We use external authentication providers and store only the user IDs from those tokens.</li>
              <li><strong>Billing Data:</strong> Billing information is handled by Stripe. Stripe stores and processes this data; we do not retain it.</li>
              <li><strong>Usage Data:</strong> We log all requests and responses to and from the API, including those made via the website client. Users may retrieve their own historical chats. We may display anonymized statistics (e.g., number of tokens, request counts) but never expose user inputs or outputs to other parties without user consent.</li>
              <li><strong>Technical Data:</strong> We may collect device information, IP addresses, and log data to secure and operate the Service.</li>
              <li><strong>No Sensitive Data:</strong> We do not collect government IDs, health data, or other special categories of personal information.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>2. How We Use Information</h2>
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
            <h2 style={headingStyle}>3. Sharing and Disclosure</h2>
            <ul style={listStyle}>
              <li><strong>Service Providers:</strong> We use third-party providers (e.g., cloud infrastructure, upstream LLM APIs, Stripe) who may process limited data on our behalf.</li>
              <li><strong>Statistics:</strong> We may share non-sensitive, aggregated usage statistics.</li>
              <li><strong>Legal Requirements:</strong> We may disclose data if required by law or to protect rights, property, or safety.</li>
              <li><strong>No Sale of Data:</strong> We do not sell personal data.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>4. Data Security</h2>
            <p style={paragraphStyle}>
              We use authentication, encryption, and access controls to protect stored data. While no method of transmission or storage is fully secure, we take reasonable steps to safeguard your information.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>5. Data Retention</h2>
            <ul style={listStyle}>
              <li>Usage data (including inputs/outputs and stats) may be retained indefinitely.</li>
              <li>Because we use external authentication, we do not maintain standalone user accounts and therefore do not currently provide account closure or deletion functionality.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>6. Your Rights</h2>
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
            <h2 style={headingStyle}>7. International Data Transfers</h2>
            <p style={paragraphStyle}>
              All data is stored and processed in the United States. By using the Service, you consent to this transfer and storage.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>8. Eligibility</h2>
            <p style={paragraphStyle}>
              Our Service is intended for users 18 years of age and older.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>9. Changes</h2>
            <p style={paragraphStyle}>
              We may update this Privacy Policy from time to time. Updates will be posted on this page with a new &ldquo;Last Updated&rdquo; date. Continued use of the Service means you accept the updated policy.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>10. Contact</h2>
            <p style={paragraphStyle}>
              If you have questions about this Privacy Policy, email us at{' '}
              <a
                href="mailto:admin@objective-ai.io"
                style={{ color: 'var(--accent)', textDecoration: 'none' }}
              >
                admin@objective-ai.io
              </a>.
            </p>
          </div>

          {/* Navigation */}
          <div style={{
            marginTop: '60px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <Link
              href="/legal/terms"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ← Terms of Service
            </Link>
            <Link
              href="/legal"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Back to Legal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
