import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function PhoneFrame({
  children,
  darkHeader = false,
  currentTime = "09:41",
  screenTag = null
}) {
  return (
    <div className="phone-mockup">
      {/* Phone Status Bar */}
      <div className={`phone-status-bar ${darkHeader ? 'dark' : 'light'}`}>
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {currentTime}
        </span>
        <div className="phone-status-icons">
          <Signal size={12} strokeWidth={2.5} />
          <Wifi size={12} strokeWidth={2.5} />
          <Battery size={14} strokeWidth={2.5} />
        </div>
      </div>

      {/* Screen Content Scrollable Body */}
      <div className="phone-content">
        {children}
      </div>

      {/* Bottom iOS / Android Home Indicator */}
      <div className="phone-home-indicator">
        <div className="bar"></div>
      </div>
    </div>
  );
}
