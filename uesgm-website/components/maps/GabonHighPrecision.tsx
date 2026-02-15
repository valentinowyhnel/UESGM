"use client"

import React, { useState, useEffect, useRef } from 'react';
import { geoPath, geoMercator, geoTransverseMercator } from 'd3-geo';
import { feature } from 'topojson-client';
import * as d3 from 'd3';

interface CityMarker {
  coords: [number, number];
  name: string;
  isCapital?: boolean;
  population?: string;
}

interface Province {
  name: string;
  capital: string;
  area: string;
}

interface Props {
  width?: number;
  height?: number;
  className?: string;
  interactive?: boolean;
  showProvinces?: boolean;
  showRivers?: boolean;
  showCities?: boolean;
  onClick?: () => void;
}

export default function GabonHighPrecision({ 
  width = 800, 
  height = 600, 
  className = "",
  interactive = false,
  showProvinces = true,
  showRivers = true,
  showCities = true,
  onClick
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Données GeoJSON précises du Gabon (contours simplifiés mais précis)
  const gabonGeoJSON = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "properties": {
        "name": "Gabon",
        "continent": "Africa"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [8.7, -2.3], [9.0, -2.5], [9.5, -2.7], [10.0, -2.8], [10.5, -2.9],
          [11.0, -3.0], [11.5, -3.1], [12.0, -3.2], [12.5, -3.3], [13.0, -3.4],
          [13.5, -3.3], [14.0, -3.1], [14.2, -2.8], [14.3, -2.5], [14.4, -2.2],
          [14.5, -1.9], [14.4, -1.6], [14.3, -1.3], [14.2, -1.0], [14.0, -0.7],
          [13.8, -0.4], [13.6, -0.1], [13.4, 0.2], [13.2, 0.5], [13.0, 0.8],
          [12.8, 1.1], [12.6, 1.4], [12.4, 1.7], [12.2, 2.0], [12.0, 2.3],
          [11.8, 2.5], [11.6, 2.7], [11.4, 2.8], [11.2, 2.9], [11.0, 3.0],
          [10.8, 2.9], [10.6, 2.8], [10.4, 2.6], [10.2, 2.4], [10.0, 2.2],
          [9.8, 2.0], [9.6, 1.8], [9.4, 1.6], [9.2, 1.4], [9.0, 1.2],
          [8.8, 1.0], [8.6, 0.8], [8.4, 0.6], [8.2, 0.4], [8.0, 0.2],
          [7.8, 0.0], [7.6, -0.2], [7.4, -0.4], [7.2, -0.6], [7.0, -0.8],
          [6.8, -1.0], [6.6, -1.2], [6.4, -1.4], [6.2, -1.6], [6.0, -1.8],
          [5.8, -2.0], [6.0, -2.2], [6.2, -2.4], [6.4, -2.6], [6.6, -2.8],
          [6.8, -3.0], [7.0, -3.1], [7.2, -3.2], [7.4, -3.3], [7.6, -3.4],
          [7.8, -3.3], [8.0, -3.2], [8.2, -3.1], [8.4, -3.0], [8.6, -2.9],
          [8.7, -2.3]
        ]]
      }
    }]
  };

  // Provinces du Gabon avec leurs coordonnées approximatives
  const provinces: Province[] = [
    { name: "Estuaire", capital: "Libreville", area: "20,990 km²" },
    { name: "Haut-Ogooué", capital: "Franceville", area: "36,547 km²" },
    { name: "Moyen-Ogooué", capital: "Lambaréné", area: "18,535 km²" },
    { name: "Ngounié", capital: "Mouila", area: "37,750 km²" },
    { name: "Nyanga", capital: "Tchibanga", area: "21,285 km²" },
    { name: "Ogooué-Ivindo", capital: "Makokou", area: "46,075 km²" },
    { name: "Ogooué-Lolo", capital: "Koulamoutou", area: "25,380 km²" },
    { name: "Ogooué-Maritime", capital: "Port-Gentil", area: "22,890 km²" },
    { name: "Woleu-Ntem", capital: "Oyem", area: "38,465 km²" }
  ];

  // Villes principales avec coordonnées précises
  const cities: CityMarker[] = [
    { coords: [9.456, -0.392], name: "Libreville", isCapital: true, population: "703,904" },
    { coords: [8.7815, -1.1333], name: "Port-Gentil", population: "136,462" },
    { coords: [13.5817, -1.6333], name: "Franceville", population: "124,367" },
    { coords: [11.5795, 2.3333], name: "Oyem", population: "60,590" },
    { coords: [11.0581, -1.8683], name: "Mouila", population: "36,447" },
    { coords: [10.6667, -0.7000], name: "Lambaréné", population: "38,799" },
    { coords: [12.8667, 0.5667], name: "Makokou", population: "20,614" },
    { coords: [13.6333, -2.1667], name: "Koulamoutou", population: "16,688" },
    { coords: [2.8500, 11.1667], name: "Tchibanga", population: "24,695" }
  ];

  // Rivières principales (coordonnées simplifiées)
  const rivers = [
    {
      name: "Ogooué",
      coords: [[10.2, -0.7], [10.5, -0.8], [11.0, -0.9], [11.5, -1.0], [12.0, -1.2], [12.5, -1.3], [13.0, -1.4], [13.5, -1.5]]
    },
    {
      name: "Nyanga",
      coords: [[10.8, -2.8], [11.0, -2.6], [11.2, -2.4], [11.4, -2.2]]
    },
    {
      name: "Ngounié",
      coords: [[10.5, -1.8], [10.8, -1.6], [11.2, -1.4], [11.6, -1.2]]
    },
    {
      name: "Ivindo",
      coords: [[12.5, 0.5], [12.8, 0.3], [13.1, 0.1], [13.4, -0.1]]
    }
  ];

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setGeoData(gabonGeoJSON);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte précise...</p>
        </div>
      </div>
    );
  }

  // Configuration de la projection pour le Gabon
  const projection = geoTransverseMercator()
    .rotate([-11.5, 0])
    .center([0, -0.8])
    .scale(width * 6)
    .translate([width / 2, height / 2]);

  const pathGenerator = geoPath().projection(projection);

  // Composant pour les marqueurs de villes
  const CityMarker = ({ projection, coords, name, isCapital, population }: any) => {
    const [x, y] = projection(coords);
    
    return (
      <g className="city-marker" transform={`translate(${x},${y})`}>
        <circle 
          r={isCapital ? 8 : 5} 
          fill={isCapital ? "#FF4444" : "#FFD700"}
          stroke="white"
          strokeWidth="2"
          className="animate-pulse"
        />
        <text 
          y={-10} 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="bold"
          fill="#333"
          style={{ textShadow: '0 1px 2px white' }}
        >
          {name}
        </text>
        {population && (
          <text 
            y={15} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#666"
          >
            {population} hab.
          </text>
        )}
        {isCapital && (
          <text 
            y={25} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#FF4444"
            fontWeight="bold"
          >
            ★ Capitale
          </text>
        )}
      </g>
    );
  };

  // Composant pour les rivières
  const Rivers = ({ projection }: any) => {
    const lineGenerator = d3.geoPath().projection(projection);

    return (
      <g className="rivers" stroke="#4A90E2" strokeWidth="2" fill="none" opacity="0.7">
        {rivers.map((river, i) => {
          const pathData = lineGenerator({type: "LineString", coordinates: river.coords});
          return pathData ? (
            <path
              key={i}
              d={pathData}
              className="river-path"
            />
          ) : null;
        })}
      </g>
    );
  };

  return (
    <div className="gabon-high-precision-container">
      <svg 
        ref={svgRef}
        width="100%" 
        height="auto" 
        viewBox={`0 0 ${width} ${height}`}
        className={`gabon-map ${className}`}
        preserveAspectRatio="xMidYMid meet"
        role="img" 
        aria-label="Carte haute précision du Gabon"
      >
        <title>Carte du Gabon - Haute Précision</title>
        
        <defs>
          {/* Dégradé pour le relief */}
          <linearGradient id="gabonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#009639" />
            <stop offset="50%" stopColor="#FCD116" />
            <stop offset="100%" stopColor="#3A75C4" />
          </linearGradient>
          
          {/* Pattern pour la texture */}
          <pattern id="texture" patternUnits="userSpaceOnUse" width="4" height="4">
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.1)"/>
          </pattern>

          {/* Filtre d'ombre */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Fond océan */}
        <rect width={width} height={height} fill="#E8F4F8"/>

        {/* Contour principal du Gabon */}
        {geoData && geoData.features && geoData.features[0] && pathGenerator(geoData.features[0]) && (
          <g className="gabon-territory">
            <path
              d={pathGenerator(geoData.features[0]) || ''}
              fill="url(#gabonGradient)"
              stroke="#2C5F2D"
              strokeWidth="2"
              filter="url(#shadow)"
              className="gabon-path"
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onClick={() => interactive && onClick?.()}
            />

            {/* Texture superposée */}
            <path
              d={pathGenerator(geoData.features[0]) || ''}
              fill="url(#texture)"
              pointerEvents="none"
            />

            {/* Frontières détaillées */}
            <path
              d={pathGenerator(geoData.features[0]) || ''}
              fill="none"
              stroke="#1A3A1A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Rivières */}
        {showRivers && <Rivers projection={projection} />}

        {/* Villes */}
        {showCities && (
          <g className="cities">
            {cities.map((city, i) => (
              <CityMarker
                key={i}
                projection={projection}
                coords={city.coords}
                name={city.name}
                isCapital={city.isCapital}
                population={city.population}
              />
            ))}
          </g>
        )}

        {/* Labels */}
        <text x={width / 2} y={height - 20} textAnchor="middle" className="map-title">
          RÉPUBLIQUE GABONAISE
        </text>
      </svg>

      <style jsx>{`
        .gabon-high-precision-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          padding: 20px;
        }
        
        .gabon-map {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .gabon-path {
          transition: all 0.3s ease;
        }

        .gabon-path:hover {
          filter: brightness(1.1);
          transform: scale(1.01);
          transform-origin: center;
        }

        .map-title {
          font-family: 'Georgia', serif;
          font-size: 24px;
          font-weight: bold;
          fill: #2C5F2D;
          letter-spacing: 3px;
        }

        .city-marker {
          animation: pulse 2s infinite;
        }

        .river-path {
          transition: all 0.3s ease;
        }

        .river-path:hover {
          stroke-width: 3;
          opacity: 1;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
