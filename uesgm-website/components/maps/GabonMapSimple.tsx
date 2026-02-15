"use client"
import React, { useState } from "react"

type Props = {
  width?: number
  height?: number
  className?: string
  interactive?: boolean
  onClick?: () => void
  showFlag?: boolean
}

export default function GabonMapSimple({ 
  width = 800, 
  height = 600, 
  className = "",
  interactive = false,
  onClick,
  showFlag = false
}: Props) {
  const [isHovered, setIsHovered] = useState(false)

  // Forme SVG simplifiée du Gabon (contours approximatifs)
  const gabonPath = "M 100 20 L 140 40 L 160 80 L 150 120 L 130 160 L 100 180 L 70 160 L 50 120 L 40 80 L 60 40 Z"

  const handleClick = () => {
    if (interactive && onClick) {
      onClick()
    }
  }

  return (
    <svg 
      width="100%" 
      height="auto" 
      viewBox="0 0 200 250"
      className={`${className} ${interactive ? 'cursor-pointer' : ''}`}
      role="img" 
      aria-label="Carte du Gabon"
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={handleClick}
    >
      <title>Carte du Gabon</title>
      
      {showFlag ? (
        // Version avec drapeau (clip-path)
        <>
          <defs>
            <clipPath id="gabonClip">
              <path d={gabonPath} />
            </clipPath>
          </defs>
          
          {/* Trois bandes du drapeau */}
          <g clipPath="url(#gabonClip)">
            <rect width="200" height="83.33" y="0" fill="#009E60" />
            <rect width="200" height="83.33" y="83.33" fill="#FFD100" />
            <rect width="200" height="83.34" y="166.66" fill="#0033A0" />
          </g>
          
          {/* Contour */}
          <path 
            d={gabonPath} 
            fill="none" 
            stroke={isHovered ? "#ffffff" : "#0A2A3C"} 
            strokeWidth={isHovered ? 3 : 2}
            style={{ transition: "all 0.3s ease" }}
          />
        </>
      ) : (
        // Version simple
        <path 
          d={gabonPath} 
          fill={isHovered ? "#059669" : "#10b981"} 
          stroke="#059669" 
          strokeWidth={2}
          style={{ transition: "all 0.3s ease" }}
        />
      )}

      {/* Villes principales */}
      <g className="cities">
        {/* Libreville */}
        <circle cx="90" cy="60" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
        <text x="98" y="64" fontSize="10" fill="#1f2937" fontWeight="bold">Libreville</text>
        
        {/* Port-Gentil */}
        <circle cx="85" cy="65" r="3" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
        <text x="90" y="68" fontSize="9" fill="#1f2937">Port-Gentil</text>
        
        {/* Franceville */}
        <circle cx="130" cy="140" r="3" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
        <text x="135" y="143" fontSize="9" fill="#1f2937">Franceville</text>
        
        {/* Oyem */}
        <circle cx="110" cy="30" r="3" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
        <text x="115" y="33" fontSize="9" fill="#1f2937">Oyem</text>
      </g>

      {/* Centre cliquable pour le recensement */}
      {interactive && (
        <g className="center-point">
          <circle 
            cx="100" 
            cy="100" 
            r="8" 
            fill="#ffffff" 
            stroke="#0A2A3C" 
            strokeWidth="2"
            className="animate-pulse"
          />
          <text 
            x="100" 
            y="105" 
            fontSize="8" 
            fill="#0A2A3C" 
            textAnchor="middle" 
            fontWeight="bold"
          >
            Recensement
          </text>
        </g>
      )}
    </svg>
  )
}
