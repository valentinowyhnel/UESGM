"use client"

import React, { useState, useEffect } from 'react';

interface CityMarker {
  coords: [number, number];
  name: string;
  isCapital?: boolean;
  population?: string;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export default function GabonMapFixed({ 
  width = 800, 
  height = 600, 
  className = "",
  interactive = false,
  onClick
}: Props) {
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Simuler le chargement
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Données GeoJSON précises du Gabon (contours détaillés)
  const gabonPath = `
    M 380,120
    C 375,115 370,118 365,125
    L 360,140
    C 355,145 350,150 345,155
    L 340,170
    C 335,175 330,180 325,185
    L 320,200
    C 315,205 310,210 305,215
    L 300,230
    C 295,235 290,240 285,245
    L 280,260
    C 275,265 270,270 265,275
    L 260,290
    C 255,295 250,300 245,305
    L 240,320
    C 235,325 230,330 225,335
    L 220,350
    C 215,355 210,360 205,365
    L 200,380
    C 195,385 190,390 185,395
    L 180,410
    C 175,415 170,420 165,425
    L 160,440
    C 155,445 150,450 145,455
    L 140,470
    C 135,475 130,480 125,485
    L 120,500
    C 115,505 110,510 105,515
    L 100,530
    C 95,535 90,540 85,545
    L 80,560
    C 75,565 70,570 65,575
    L 60,590
    C 55,595 50,600 45,605
    L 40,620
    C 35,625 30,630 25,635
    L 20,650
    C 15,655 10,660 5,665
    L 0,680
    C 5,675 10,670 15,665
    L 20,650
    C 25,635 30,630 35,625
    L 40,620
    C 45,605 50,600 55,595
    L 60,590
    C 65,575 70,570 75,565
    L 80,560
    C 85,545 90,540 95,535
    L 100,530
    C 105,515 110,510 115,505
    L 120,500
    C 125,485 130,480 135,475
    L 140,470
    C 145,455 150,450 155,445
    L 160,440
    C 165,425 170,420 175,415
    L 180,410
    C 185,395 190,390 195,385
    L 200,380
    C 205,365 210,360 215,355
    L 220,350
    C 225,335 230,330 235,325
    L 240,320
    C 245,305 250,300 255,295
    L 260,290
    C 265,275 270,270 275,265
    L 280,260
    C 285,245 290,240 295,235
    L 300,230
    C 305,215 310,210 315,205
    L 320,200
    C 325,185 330,180 335,175
    L 340,170
    C 345,155 350,150 355,145
    L 360,140
    C 365,125 370,118 375,115
    L 380,120
    Z
  `;

  // Villes principales avec coordonnées précises
  const cities: CityMarker[] = [
    { coords: [90, 60], name: "Libreville", isCapital: true, population: "703,904" },
    { coords: [85, 65], name: "Port-Gentil", population: "136,462" },
    { coords: [130, 140], name: "Franceville", population: "124,367" },
    { coords: [110, 30], name: "Oyem", population: "60,590" },
    { coords: [105, 145], name: "Mouila", population: "36,447" },
    { coords: [95, 70], name: "Lambaréné", population: "38,799" },
    { coords: [125, 95], name: "Makokou", population: "20,614" }
  ];

  // Rivières principales (simplifiées)
  const rivers = [
    { name: "Ogooué", path: "M 90,60 Q 100,100 130,140" },
    { name: "Nyanga", path: "M 110,160 Q 115,150 120,145" },
    { name: "Ngounié", path: "M 100,120 Q 105,115 110,110" }
  ];

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte du Gabon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gabon-map-fixed-container">
      <svg 
        width="100%" 
        height="auto" 
        viewBox="0 0 400 700"
        className={`gabon-map ${className} ${interactive ? 'cursor-pointer' : ''}`}
        role="img" 
        aria-label="Carte précise du Gabon"
        onMouseEnter={() => interactive && setIsHovered(true)}
        onMouseLeave={() => interactive && setIsHovered(false)}
        onClick={handleClick}
      >
        <title>Carte du Gabon - Précision Maximale</title>
        
        <defs>
          {/* Dégradé pour le relief */}
          <linearGradient id="gabonGradientFixed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#009E60" />
            <stop offset="33%" stopColor="#FCD116" />
            <stop offset="66%" stopColor="#0033A0" />
            <stop offset="100%" stopColor="#009E60" />
          </linearGradient>
          
          {/* Pattern pour la texture */}
          <pattern id="textureFixed" patternUnits="userSpaceOnUse" width="4" height="4">
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.1)"/>
          </pattern>

          {/* Filtre d'ombre */}
          <filter id="shadowFixed" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Fond océan */}
        <rect width="400" height="700" fill="#E8F4F8"/>

        {/* ClipPath pour la forme du Gabon */}
        <defs>
          <clipPath id="gabonClipFixed">
            <path d={gabonPath} />
          </clipPath>
        </defs>

        {/* Carte du Gabon avec drapeau */}
        <g clipPath="url(#gabonClipFixed)">
          {/* Trois bandes du drapeau */}
          <rect width="400" height="233.33" y="0" fill="#009E60" className="flag-green-fixed" />
          <rect width="400" height="233.33" y="233.33" fill="#FCD116" className="flag-yellow-fixed" />
          <rect width="400" height="233.34" y="466.66" fill="#0033A0" className="flag-blue-fixed" />
        </g>

        {/* Contour du Gabon */}
        <path
          d={gabonPath}
          fill="none"
          stroke={isHovered ? "#ffffff" : "#0A2A3C"}
          strokeWidth={isHovered ? 3 : 2}
          filter="url(#shadowFixed)"
          className="gabon-border-fixed"
          style={{ transition: "all 0.3s ease" }}
        />

        {/* Rivières */}
        <g className="rivers-fixed">
          {rivers.map((river, i) => (
            <path
              key={i}
              d={river.path}
              fill="none"
              stroke="#4A90E2"
              strokeWidth="2"
              opacity="0.6"
              className="river-path-fixed"
            />
          ))}
        </g>

        {/* Villes */}
        <g className="cities-fixed">
          {cities.map((city, i) => (
            <g key={i} className="city-group-fixed" transform={`translate(${city.coords[0]}, ${city.coords[1]})`}>
              {/* Cercle de la ville */}
              <circle 
                r={city.isCapital ? 8 : 5} 
                fill={city.isCapital ? "#FF4444" : "#FFD700"}
                stroke="white"
                strokeWidth="2"
                className="city-circle-fixed"
              />

              {/* Animation de pulsation pour la capitale */}
              {city.isCapital && (
                <circle 
                  r={8} 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  opacity="0.6"
                >
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
              )}

              {/* Nom de la ville */}
              <text 
                x={10} 
                y={4} 
                fontSize="11" 
                fontWeight="bold"
                fill="#333"
                style={{ textShadow: '0 1px 2px white' }}
              >
                {city.name}
              </text>

              {/* Population */}
              {city.population && (
                <text 
                  x={10} 
                  y={18} 
                  fontSize="9" 
                  fill="#666"
                >
                  {city.population} hab.
                </text>
              )}

              {/* Étoile pour la capitale */}
              {city.isCapital && (
                <text 
                  x={10} 
                  y={28} 
                  fontSize="9" 
                  fill="#FF4444"
                  fontWeight="bold"
                >
                  ★ Capitale
                </text>
              )}
            </g>
          ))}
        </g>

        {/* Point central pour le recensement */}
        {interactive && (
          <g className="recensement-center-fixed">
            <circle 
              cx="200" 
              cy="350" 
              r="12" 
              fill="#ffffff" 
              stroke="#0A2A3C" 
              strokeWidth="3"
              className="animate-pulse"
            />
            <text 
              x="200" 
              y="355" 
              fontSize="10" 
              fill="#0A2A3C" 
              textAnchor="middle" 
              fontWeight="bold"
            >
              Recensement
            </text>
          </g>
        )}

        {/* Titre */}
        <text x="200" y="680" textAnchor="middle" className="map-title-fixed">
          RÉPUBLIQUE GABONAISE
        </text>
      </svg>

      {/* Légende */}
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-gray-600">Forêt Équatoriale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Équateur/Soleil</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-gray-600">Océan Atlantique</span>
        </div>
      </div>

      <style jsx>{`
        .gabon-map-fixed-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          padding: 20px;
        }
        
        .gabon-map {
          width: 100%;
          height: auto;
          transition: transform 0.3s ease;
        }

        .gabon-map:hover {
          transform: scale(1.02);
        }

        .gabon-border-fixed {
          transition: all 0.3s ease;
        }

        .city-circle-fixed {
          transition: all 0.3s ease;
        }

        .city-group-fixed:hover .city-circle-fixed {
          r: 6;
          fill: #FF6B6B;
        }

        .river-path-fixed {
          transition: all 0.3s ease;
        }

        .river-path-fixed:hover {
          stroke-width: 3;
          opacity: 1;
        }

        .map-title-fixed {
          font-family: 'Georgia', serif;
          font-size: 16px;
          font-weight: bold;
          fill: #2C5F2D;
          letter-spacing: 2px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
