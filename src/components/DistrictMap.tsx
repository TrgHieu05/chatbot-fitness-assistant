import { useState } from 'react';
import { motion } from 'motion/react';

interface DistrictMapProps {
  onDistrictSelect: (district: number | null) => void;
  selectedDistrict: number | null;
  language: 'en' | 'vi';
}

export function DistrictMap({ onDistrictSelect, selectedDistrict, language }: DistrictMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);

  const districts = [
    {
      id: 1,
      name: language === 'en' ? 'District 1' : 'Quận 1',
      color: '#86efac',
      path: 'M 250 180 L 320 170 L 340 200 L 350 240 L 330 270 L 280 280 L 250 260 L 240 220 Z',
    },
    {
      id: 3,
      name: language === 'en' ? 'District 3' : 'Quận 3',
      color: '#93c5fd',
      path: 'M 240 120 L 320 110 L 360 140 L 350 180 L 320 170 L 250 180 L 240 150 Z',
    },
    {
      id: 10,
      name: language === 'en' ? 'District 10' : 'Quận 10',
      color: '#fdba74',
      path: 'M 160 160 L 240 150 L 250 180 L 240 220 L 250 260 L 200 270 L 160 250 L 150 200 Z',
    },
  ];

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 500 400"
        className="w-full h-auto"
        style={{ maxHeight: '300px' }}
      >
        {/* Background - other districts (greyed out) */}
        <path
          d="M 100 50 L 450 40 L 460 350 L 90 360 Z"
          fill="#374151"
          opacity="0.3"
        />

        {/* Major roads */}
        <line x1="100" y1="150" x2="400" y2="145" stroke="#4b5563" strokeWidth="1" opacity="0.5" />
        <line x1="240" y1="50" x2="250" y2="350" stroke="#4b5563" strokeWidth="1" opacity="0.5" />
        <line x1="150" y1="100" x2="350" y2="280" stroke="#4b5563" strokeWidth="1" opacity="0.5" />

        {/* Clickable districts */}
        {districts.map((district) => (
          <motion.g
            key={district.id}
            onMouseEnter={() => setHoveredDistrict(district.id)}
            onMouseLeave={() => setHoveredDistrict(null)}
            onClick={() => onDistrictSelect(selectedDistrict === district.id ? null : district.id)}
            style={{ cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <path
              d={district.path}
              fill={district.color}
              opacity={selectedDistrict === district.id || hoveredDistrict === district.id ? 0.9 : 0.6}
              stroke="#fff"
              strokeWidth="2"
            />
            <text
              x={district.id === 1 ? 290 : district.id === 3 ? 285 : 200}
              y={district.id === 1 ? 230 : district.id === 3 ? 150 : 210}
              fill="#000"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {district.id}
            </text>
          </motion.g>
        ))}

        {/* Labels */}
        {districts.map((district) => (
          <text
            key={`label-${district.id}`}
            x={district.id === 1 ? 290 : district.id === 3 ? 285 : 200}
            y={district.id === 1 ? 250 : district.id === 3 ? 170 : 230}
            fill="#fff"
            fontSize="10"
            textAnchor="middle"
            opacity="0.8"
          >
            {district.name}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {districts.map((district) => (
          <button
            key={district.id}
            onClick={() => onDistrictSelect(selectedDistrict === district.id ? null : district.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
              selectedDistrict === district.id
                ? 'bg-white/20 border border-white/40'
      : 'bg-white/10 border border-gray-300'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: district.color }}
            />
            <span className="text-white text-sm">{district.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
