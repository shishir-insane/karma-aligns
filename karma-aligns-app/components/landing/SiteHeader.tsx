'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Moon from './Moon'

export default function SiteHeader() {
  const handleScrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevents the default link behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="relative z-20">
      <nav className="container mx-auto flex items-center justify-between px-4 py-6 md:px-8">
        <Link href="/" onClick={handleScrollToTop} className="flex items-center" aria-label="Karma Aligns Home">
          <Image
            src="/karma-aligns-logo.png"
            alt="Karma Aligns Logo"
            width={120}
            height={50}
            priority
          />
        </Link>
      </nav>
      <Moon />
    </header>
  );
}