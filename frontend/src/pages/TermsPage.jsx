import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[15px] shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 1, 2026</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using the SkipQ platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use of Service</h2>
            <p>SkipQ provides an online food ordering and delivery platform. You must be at least 18 years old to use this service. You are responsible for maintaining the confidentiality of your account credentials.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Orders and Payments</h2>
            <p>All orders placed through SkipQ are subject to availability and restaurant acceptance. Prices displayed are set by individual restaurants and may change without notice. Payment must be completed at the time of order placement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Delivery</h2>
            <p>Delivery times are estimates and may vary based on demand, distance, and other factors. SkipQ is not responsible for delays caused by circumstances beyond our control.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cancellation and Refunds</h2>
            <p>Orders may be cancelled before the restaurant begins preparation. Refund policies vary by payment method and order status. Please contact support for assistance with cancellations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at support@skipqapp.com.</p>
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
