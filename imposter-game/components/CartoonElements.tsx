'use client';

// Cartoon Detective Narrator Character
export function DetectiveNarrator({ 
  mood = 'happy', 
  size = 120 
}: { 
  mood?: 'happy' | 'thinking' | 'shocked' | 'angry' | 'wink';
  size?: number;
}) {
  const eyeR = mood === 'wink' ? null : true;
  const mouthPath = {
    happy: 'M 35 72 Q 50 85 65 72',
    thinking: 'M 38 75 Q 50 70 62 75',
    shocked: 'M 42 70 Q 50 82 58 70 Q 50 85 42 70',
    angry: 'M 38 78 Q 50 72 62 78',
    wink: 'M 35 72 Q 50 85 65 72'
  };
  const browOffset = mood === 'angry' ? 4 : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="animate-narrator drop-shadow-lg">
      {/* Hat */}
      <ellipse cx="50" cy="28" rx="38" ry="8" fill="#3D2B1F" />
      <rect x="25" y="8" width="50" height="22" rx="4" fill="#5C3A1E" />
      <rect x="30" y="5" width="40" height="6" rx="3" fill="#3D2B1F" />
      <rect x="28" y="22" width="44" height="4" rx="1" fill="#FFD93D" />

      {/* Face */}
      <circle cx="50" cy="55" r="28" fill="#FFDAB9" stroke="#D4A574" strokeWidth="2" />

      {/* Eyes */}
      <g>
        {/* Left eye */}
        <circle cx="40" cy={48 - browOffset} r="5" fill="white" stroke="#3D2B1F" strokeWidth="1.5" />
        <circle cx="41" cy={48 - browOffset} r="2.5" fill="#3D2B1F" />
        <circle cx="42" cy={46.5 - browOffset} r="1" fill="white" />
        
        {/* Left brow */}
        <path d={`M 34 ${40 - browOffset} Q 40 ${36 - browOffset * 2} 46 ${40 - browOffset}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        
        {/* Right eye */}
        {mood === 'wink' ? (
          <path d="M 55 48 Q 60 45 65 48" stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="60" cy={48 - browOffset} r="5" fill="white" stroke="#3D2B1F" strokeWidth="1.5" />
            <circle cx="61" cy={48 - browOffset} r="2.5" fill="#3D2B1F" />
            <circle cx="62" cy={46.5 - browOffset} r="1" fill="white" />
          </>
        )}
        
        {/* Right brow */}
        <path d={`M 54 ${40 - browOffset} Q 60 ${36 - browOffset * 2} 66 ${40 - browOffset}`} stroke="#3D2B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Nose */}
      <ellipse cx="50" cy="58" rx="3" ry="2" fill="#E8A87C" />

      {/* Mouth */}
      <path d={mouthPath[mood]} stroke="#3D2B1F" strokeWidth="2" fill={mood === 'shocked' ? '#3D2B1F' : 'none'} strokeLinecap="round" />

      {/* Cheeks */}
      <circle cx="33" cy="60" r="4" fill="#FFB6C1" opacity="0.5" />
      <circle cx="67" cy="60" r="4" fill="#FFB6C1" opacity="0.5" />

      {/* Magnifying glass */}
      <g transform="translate(68, 60) rotate(30)">
        <circle cx="0" cy="0" r="8" fill="none" stroke="#8B5E3C" strokeWidth="3" />
        <circle cx="0" cy="0" r="6" fill="rgba(173,216,230,0.3)" />
        <line x1="6" y1="6" x2="14" y2="14" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Masked Imposter Character
export function ImposterCharacter({ size = 100 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="animate-float drop-shadow-lg">
      {/* Body */}
      <ellipse cx="50" cy="80" rx="20" ry="15" fill="#2D1B69" />
      
      {/* Head */}
      <circle cx="50" cy="45" r="25" fill="#1a0533" stroke="#845EC2" strokeWidth="2" />
      
      {/* Mask */}
      <path d="M 28 38 Q 50 32 72 38 L 70 52 Q 50 56 30 52 Z" fill="#845EC2" stroke="#FFD93D" strokeWidth="1.5" />
      
      {/* Eyes glowing */}
      <circle cx="40" cy="43" r="5" fill="#FF6B6B">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="43" r="5" fill="#FF6B6B">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="43" r="2" fill="white" />
      <circle cx="60" cy="43" r="2" fill="white" />
      
      {/* Question mark */}
      <text x="50" y="26" textAnchor="middle" fontSize="16" fill="#FFD93D" fontWeight="bold">?</text>
    </svg>
  );
}

// Floating decorative items for sides
export function DecoItems({ side }: { side: 'left' | 'right' }) {
  const items = side === 'left' 
    ? ['🔍', '🎭', '🕵️', '💬', '🗳️']
    : ['❓', '🎯', '🤔', '👀', '🏆'];
  
  return (
    <div className={side === 'left' ? 'deco-left' : 'deco-right'}>
      {items.map((item, i) => (
        <span 
          key={i} 
          style={{ 
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`
          }}
          className="animate-float"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// Confetti component for results
export function Confetti() {
  const colors = ['#FFD93D', '#FF6B6B', '#00D2FC', '#FF61D2', '#00C9A7', '#B8E900', '#845EC2'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 3}s`,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`
          }}
        />
      ))}
    </div>
  );
}

// Player color palette
export const PLAYER_COLORS = [
  '#FF6B6B', '#4B7BE5', '#00C9A7', '#FFD93D', 
  '#FF61D2', '#FF8C42', '#845EC2', '#00D2FC',
  '#B8E900', '#E8A87C', '#FF9671', '#7C3AED'
];

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// Player avatar emoji based on index
export const PLAYER_AVATARS = [
  '🦊', '🐱', '🐶', '🐼', '🦁', '🐸',
  '🐨', '🐯', '🐷', '🐵', '🦄', '🐲'
];

export function getPlayerAvatar(index: number): string {
  return PLAYER_AVATARS[index % PLAYER_AVATARS.length];
}
