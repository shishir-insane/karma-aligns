import React from 'react';

export default function PlanetOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Mercury */}
      <div className="planet mercury animate-orbit-mercury">
        <div className="planet-dot bg-gray-400" />
      </div>
      {/* Venus */}
      <div className="planet venus animate-orbit-venus">
        <div className="planet-dot bg-orange-300" />
      </div>
      {/* Mars */}
      <div className="planet mars animate-orbit-mars">
        <div className="planet-dot bg-red-500" />
      </div>
      {/* Jupiter */}
      <div className="planet jupiter animate-orbit-jupiter">
        <div className="planet-dot bg-amber-600" />
      </div>
      {/* Saturn */}
      <div className="planet saturn animate-orbit-saturn">
        <div className="planet-dot bg-yellow-400" />
      </div>
    </div>
  );
}