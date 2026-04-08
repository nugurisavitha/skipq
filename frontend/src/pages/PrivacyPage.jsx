import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[15px] shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 1, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly, including your name, email address, phone number, delivery address, and payment information when you create an account or place an order.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to process orders, provide delivery services, communicate with you about your orders, improve our platform, and send promotional offers (with your consent).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
            <p>We share your information with restaurants to fulfill orders, with delivery partners to complete deliveries, and with payment processors to handle transactions. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. However, no method of electronic transmission or storage is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information at any time through your account settings. You may also contact us to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@skipqapp.com.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link to="/" className="text-primary hover:text-primary-dark font-medium transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
