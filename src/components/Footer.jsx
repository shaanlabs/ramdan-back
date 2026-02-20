import React from 'react';

const Footer = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-6 px-4 md:py-8 md:px-6 lg:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Copyright Notice */}
        <div className="text-center mb-3 md:mb-4">
          <div className="inline-block bg-yellow-500 text-gray-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm lg:text-base">
            © 2026 AIMCA - All Rights Reserved
          </div>
        </div>

        {/* Collaboration */}
        <div className="text-center text-xs md:text-sm lg:text-base mb-3 md:mb-4">
          <p className="text-emerald-100">
            Developed in collaboration with{' '}
            <span className="font-bold text-yellow-400">AtomNext</span>
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-emerald-700 my-3 md:my-4"></div>

        {/* Additional Info */}
        <div className="text-center text-xs md:text-sm text-emerald-200 space-y-1 md:space-y-2">
          <p>Made with ❤️ for the AIMCA Family</p>
          <p className="text-emerald-300 px-2">
            May Allah accept our efforts and grant us success in this blessed month
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
