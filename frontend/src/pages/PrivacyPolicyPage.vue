<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <button
          @click="handleBack"
          class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <span>← Back</span>
        </button>
      </div>

      <div class="neo-card border-neo-3 border-black shadow-neo-hard">
        <div class="p-8 border-b-4 border-black">
          <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p class="mt-2 text-slate-600 dark:text-slate-400">
            Last updated: February 6, 2026
          </p>
        </div>

        <div class="p-8 space-y-8">
          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              1. Information We Collect
            </h2>
            <div class="space-y-3 text-slate-700 dark:text-slate-300">
              <p><strong class="text-slate-900 dark:text-white">Account Information:</strong> Name, email address, and other details you provide when creating an account.</p>
              <p><strong class="text-slate-900 dark:text-white">Social Media Data:</strong> Analytics, posts, and engagement metrics from connected social media accounts.</p>
              <p><strong class="text-slate-900 dark:text-white">Usage Data:</strong> How you interact with our service, including pages visited, features used, and time spent.</p>
              <p><strong class="text-slate-900 dark:text-white">Device Information:</strong> IP address, browser type, operating system, and device identifiers.</p>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <ul class="space-y-2 text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Provide and improve our services</li>
              <li>Process and display your social media analytics</li>
              <li>Schedule and manage social media posts</li>
              <li>Send important service communications</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. Information Sharing
            </h2>
            <div class="space-y-3 text-slate-700 dark:text-slate-300">
              <p>We do not sell your personal data. We may share information in the following circumstances:</p>
              <p><strong class="text-slate-900 dark:text-white">Social Media Platforms:</strong> With platforms you connect (Instagram, TikTok, etc.) to provide our services.</p>
              <p><strong class="text-slate-900 dark:text-white">Service Providers:</strong> With trusted third-party services that help us operate our platform.</p>
              <p><strong class="text-slate-900 dark:text-white">Legal Requirements:</strong> When required by law or to protect our rights.</p>
              <p><strong class="text-slate-900 dark:text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</p>
            </div>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Data Security
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              5. Your Rights
            </h2>
            <ul class="space-y-2 text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Revoke social media connections</li>
              <li>Request information about how we use your data</li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Cookies and Tracking
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We use cookies and similar technologies to remember your preferences, analyze traffic, and improve our services. You can control cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Data Retention
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We retain your information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will remove or anonymize your personal data.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              8. Third-Party Services
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our service integrates with third-party social media platforms. Each platform has its own privacy policy, and we encourage you to review them when connecting accounts.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              9. Children's Privacy
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              Gelitik is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              10. Changes to This Policy
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              11. Contact Us
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p class="mt-2 text-slate-900 dark:text-white font-medium">
              privacy@gelitik.com
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
