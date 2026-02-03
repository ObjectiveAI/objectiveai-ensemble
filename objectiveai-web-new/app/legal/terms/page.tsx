"use client";

import Link from "next/link";
import { useIsMobile } from "../../../hooks/useIsMobile";

export default function TermsPage() {
  const isMobile = useIsMobile();

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
            Terms of Service
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
              Welcome to Objective Artificial Intelligence, Inc. ("ObjectiveAI," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our API and website (together, the "Service"). Please read them carefully. By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use the Service.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>1. Services Overview</h2>
            <p style={paragraphStyle}>
              ObjectiveAI provides access to artificial intelligence models through our API and website. We may update, modify, suspend, or discontinue any part of the Service at any time without liability.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>2. Eligibility</h2>
            <p style={paragraphStyle}>
              You must be at least 18 years of age to use the Service. By using the Service, you represent that you meet this requirement and that your use of the Service complies with all applicable laws.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>3. Accounts and Authentication</h2>
            <p style={paragraphStyle}>
              We use third-party authentication providers. We do not store emails or passwords. You are responsible for maintaining the security of your external authentication credentials. We are not responsible for any unauthorized access resulting from compromised credentials.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>4. Credits and Payments</h2>
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
            <h2 style={headingStyle}>5. User Content (Inputs and Outputs)</h2>
            <ul style={listStyle}>
              <li><strong>Ownership:</strong> You retain ownership of all inputs and outputs you generate using the Service.</li>
              <li><strong>Rights Reserved:</strong> By using the Service, you grant ObjectiveAI the right to store and process your inputs and outputs in order to provide and improve the Service.</li>
              <li><strong>Model Improvement:</strong> We reserve the right to use stored data for model improvement.</li>
              <li><strong>Upstream Providers:</strong> Requests may be routed to upstream AI providers. By using the Service, you agree to the applicable terms of those providers. Users may configure providers that do not store data if they wish to avoid upstream storage.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>6. Acceptable Use</h2>
            <p style={paragraphStyle}>
              You may not use the Service for illegal, harmful, or fraudulent purposes. You are solely responsible for your activity when using the Service.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>7. Service Availability</h2>
            <p style={paragraphStyle}>
              We strive to maintain reliable access but do not guarantee uptime. Service availability may depend on upstream providers. The Service is provided "as is" and "as available."
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>8. Intellectual Property</h2>
            <p style={paragraphStyle}>
              ObjectiveAI retains all rights, title, and interest in and to its technology, branding, and services. Your use of the Service does not grant you any ownership of our intellectual property.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>9. Disclaimers and Limitation of Liability</h2>
            <ul style={listStyle}>
              <li><strong>Disclaimers:</strong> The Service is provided "as is" without warranties of any kind, express or implied, including fitness for a particular purpose or non-infringement.</li>
              <li><strong>Liability Cap:</strong> To the maximum extent permitted by law, ObjectiveAI's total liability for any claim is limited to the greater of: (a) the amount you paid us in the 12 months prior to the event giving rise to the claim, or (b) $100.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>10. Termination</h2>
            <ul style={listStyle}>
              <li><strong>By You:</strong> You may stop using the Service at any time.</li>
              <li><strong>By Us:</strong> We may suspend or terminate your access at any time, including for violations of these Terms. In such cases, we will refund your remaining purchased credit balance.</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>11. Feedback</h2>
            <p style={paragraphStyle}>
              If you provide us with feedback, suggestions, or ideas, you grant us a perpetual, royalty-free right to use them without restriction or compensation.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>12. Governing Law and Dispute Resolution</h2>
            <p style={paragraphStyle}>
              These Terms are governed by the laws of the State of Delaware. Any disputes will be resolved through binding arbitration on an individual basis. You waive the right to participate in class actions or class-wide arbitration.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>13. Changes to These Terms</h2>
            <p style={paragraphStyle}>
              We may update these Terms from time to time. Updated versions will be posted on our website with a new "Last Updated" date. Continued use of the Service after updates constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 style={headingStyle}>14. Contact Us</h2>
            <p style={paragraphStyle}>
              If you have questions about these Terms, please email us at{' '}
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
              href="/legal/privacy"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Privacy Policy →
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
