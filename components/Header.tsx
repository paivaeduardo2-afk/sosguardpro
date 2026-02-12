
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">!</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900">SOS<span className="text-red-600 font-bold">GUARD</span></h1>
      </div>
      <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
        ATIVO
      </div>
    </header>
  );
};

export default Header;
