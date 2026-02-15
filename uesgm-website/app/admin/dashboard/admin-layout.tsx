'use client';

import React from 'react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>{children}</div>
    </div>
  );
}
