'use client';

import { DetectiveNarrator } from './CartoonElements';

interface ModeSelectionProps {
  onSelectLocal: () => void;
  onSelectOnline: () => void;
}

export default function ModeSelection({ onSelectLocal, onSelectOnline }: ModeSelectionProps) {
  return (
    <div className="dialog-panel p-6 md:p-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <DetectiveNarrator mood="happy" size={60} />
        <div>
          <h2 className="section-title text-2xl md:text-3xl">How do you want to play?</h2>
          <p className="text-gray-500 text-sm mt-1">Choose your game mode</p>
        </div>
      </div>

      {/* Mode Cards */}
      <div className="space-y-4">
        {/* Local Mode */}
        <button
          onClick={onSelectLocal}
          className="w-full text-left cartoon-card p-5 hover:scale-[1.02] transition-transform cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📱</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                Local Mode
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Pass the phone around — all players share one device. 
                Perfect for playing in person!
              </p>
            </div>
            <div className="text-purple-400 text-2xl">→</div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
              Same Device
            </span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
              3+ Players
            </span>
          </div>
        </button>

        {/* Online Mode */}
        <button
          onClick={onSelectOnline}
          className="w-full text-left cartoon-card p-5 hover:scale-[1.02] transition-transform cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌐</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                Online Mode
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Create a lobby and share the code — each player uses their own device. 
                Play with friends anywhere!
              </p>
            </div>
            <div className="text-blue-400 text-2xl">→</div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
              Multiple Devices
            </span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
              Room Code
            </span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
              3-12 Players
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
