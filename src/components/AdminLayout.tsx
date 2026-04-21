import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings } from 'lucide-react';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar / Top Nav */}
      <aside className="w-full lg:w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-5 flex lg:block items-center justify-between border-b border-gray-800 lg:border-none">
          <h2 className="text-xl font-bold text-blue-400 italic tracking-tight">JLC Admin</h2>
          <div className="lg:hidden text-[10px] uppercase font-bold text-gray-500 bg-gray-800 px-2 py-1 rounded">
            v1.0 Alpha
          </div>
        </div>
        
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible px-2 lg:px-4 py-3 lg:space-y-1">
          <Link
            to="/admin"
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800 transition whitespace-nowrap shrink-0 lg:w-full"
          >
            <LayoutDashboard size={18} className="text-blue-400" />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          <Link
            to="/admin/upload"
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800 transition whitespace-nowrap shrink-0 lg:w-full"
          >
            <FileUp size={18} className="text-gray-400" />
            <span className="font-medium text-sm">Bulk Ingest</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800 transition whitespace-nowrap shrink-0 lg:w-full"
          >
            <Settings size={18} className="text-gray-400" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </nav>
        
        <div className="hidden lg:block mt-auto p-6 border-t border-gray-800/50">
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</p>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-300">System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 shrink-0 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Project Management</h1>
          <div className="hidden md:flex items-center space-x-4">
            <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              JL
            </span>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;