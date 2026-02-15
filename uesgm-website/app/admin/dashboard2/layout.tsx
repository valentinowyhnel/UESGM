'use client';

import React from 'react';

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1>Test Layout</h1>
      {children}
    </div>
  );
}
