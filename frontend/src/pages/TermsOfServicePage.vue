<script setup lang="ts">
import { useRouter } from "vue-router";

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
          class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span>← Back</span>
        </button>
      </div>

      <div class="neo-card border-neo-3 border-black shadow-neo-hard">
        <div class="p-8 border-b-4 border-black">
          <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p class="mt-2 text-slate-600 dark:text-slate-400">Last updated: February 6, 2026</p>
        </div>

        <div class="p-8 space-y-8">
          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              By accessing and using Gelitik, you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              Gelitik is a social media management platform that provides tools for scheduling,
              analytics, and managing social media accounts across multiple platforms.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              3. User Responsibilities
            </h2>
            <ul class="space-y-2 text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Maintain the security of your account credentials</li>
              <li>Provide accurate and current information</li>
              <li>Use the service in compliance with applicable laws</li>
              <li>Not share content that violates third-party rights</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              4. Intellectual Property
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              All content, features, and functionality of Gelitik are owned by Gelitik Lab and are
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Termination</h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations
              of these terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              6. Limitation of Liability
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              Gelitik shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              7. Changes to Terms
            </h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              We may update these terms from time to time. Continued use of the service after
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Contact Us</h2>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p class="mt-2 text-slate-900 dark:text-white font-medium">support@gelitik.com</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
