'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="w-full bg-gray-950 text-white/70 py-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start space-y-4">
          <Link href="/" aria-label="Karma Aligns Home" className="transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95">
            <Image
              src="/karma-aligns-logo.png"
              alt="Karma Aligns Logo"
              width={80}
              height={33}
              className="opacity-80"
            />
          </Link>
          <p className="text-sm">© 2025 Karma Aligns. All rights reserved.</p>
        </div>

        <div className="flex flex-col items-center md:items-start space-y-2 text-sm">
          <span className="font-semibold text-white/90 mb-1">Quick Links</span>
          <Link href="/privacy" className="hover:text-white transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors duration-200">
            Terms of Service
          </Link>
          <Link href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
            GitHub
          </Link>
        </div>

        <div className="flex flex-col items-center md:items-start space-y-2">
          <a
            href="mailto:contact@karma-aligns.com"
            className="rounded-2xl ka-card transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 px-5 py-2 text-sm font-semibold text-white/90"
          >
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}