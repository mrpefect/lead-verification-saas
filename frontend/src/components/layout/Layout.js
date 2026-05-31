import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 lg:p-8 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
