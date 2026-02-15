"use client"
import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"

type Props = {
  topoJsonUrl?: string
  width?: number
  height?: number
  className?: string
  interactive?: boolean
  onClick?: () => void
}

export default function GabonFlagClip({ 
  topoJsonUrl = "/data/gabon.topojson", 
  width = 800, 
  height = 600, 
  className = "",
  interactive = false,
  onClick
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function draw() {
      try {
        const res = await fetch(topoJsonUrl)
        const topo = await res.json()
        const geo = feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as any

        // Projection optimisée pour le Gabon
        const projection = d3.geoMercator()
          .center([11.8, -0.8])
          .scale(width * 4)
          .translate([width / 2, height / 2])

        const path = d3.geoPath().projection(projection)
        const pathD = path(geo) || ""

        const svg = d3.select(ref.current)
        svg.selectAll("*").remove()

        // Configuration SVG
        svg
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet")

        // Définition du clipPath (forme du Gabon)
        const defs = svg.append("defs")
        defs.append("clipPath")
          .attr("id", "gabonClip")
          .append("path")
          .attr("d", pathD)

        // Groupe principal avec clipPath
        const flagGroup = svg.append("g")
          .attr("clip-path", "url(#gabonClip)")

        // Trois bandes horizontales du drapeau
        flagGroup.append("rect")
          .attr("width", width)
          .attr("height", height / 3)
          .attr("y", 0)
          .attr("fill", "#009E60") // Vert forêt
          .attr("class", "flag-green")

        flagGroup.append("rect")
          .attr("width", width)
          .attr("height", height / 3)
          .attr("y", height / 3)
          .attr("fill", "#FFD100") // Jaune équateur/soleil
          .attr("class", "flag-yellow")

        flagGroup.append("rect")
          .attr("width", width)
          .attr("height", height / 3)
          .attr("y", (height / 3) * 2)
          .attr("fill", "#0033A0") // Bleu océan
          .attr("class", "flag-blue")

        // Contour du Gabon
        svg.append("path")
          .attr("d", pathD)
          .attr("fill", "none")
          .attr("stroke", "#0A2A3C")
          .attr("stroke-width", 3)
          .attr("class", "border")

        // Ajouter les villes principales
        const cities = [
          { name: "Libreville", coords: [9.45, -0.39], pop: "703k" },
          { name: "Port-Gentil", coords: [8.78, -0.63], pop: "134k" },
          { name: "Franceville", coords: [13.58, -1.63], pop: "124k" },
          { name: "Oyem", coords: [11.58, 2.33], pop: "60k" },
          { name: "Mouila", coords: [11.05, -1.87], pop: "36k" }
        ]

        // Points des villes avec animation
        svg.selectAll(".city")
          .data(cities)
          .enter()
          .append("g")
          .attr("class", "city-group")
          .each(function(d: any) {
            const g = d3.select(this)
            const coords = projection(d.coords as [number, number])!
            
            // Cercle de la ville
            g.append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", 6)
              .attr("fill", "#ffffff")
              .attr("stroke", "#0A2A3C")
              .attr("stroke-width", 2)
              .style("cursor", interactive ? "pointer" : "default")
              .style("transition", "all 0.3s ease")

            // Animation de pulsation
            g.append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", 6)
              .attr("fill", "none")
              .attr("stroke", "#ffffff")
              .attr("stroke-width", 2)
              .attr("opacity", 0.6)
              .append("animate")
              .attr("attributeName", "r")
              .attr("values", "6;12;6")
              .attr("dur", "2s")
              .attr("repeatCount", "indefinite")

            // Nom de la ville
            g.append("text")
              .attr("x", coords[0] + 10)
              .attr("y", coords[1] + 4)
              .attr("font-size", "14px")
              .attr("font-weight", "bold")
              .attr("fill", "#ffffff")
              .attr("stroke", "#0A2A3C")
              .attr("stroke-width", 0.5)
              .text(d.name)

            // Population
            g.append("text")
              .attr("x", coords[0] + 10)
              .attr("y", coords[1] + 18)
              .attr("font-size", "11px")
              .attr("fill", "#ffffff")
              .attr("opacity", 0.8)
              .text(d.pop)
          })

        // Interactivité
        if (interactive) {
          svg.style("cursor", "pointer")
            .on("click", function(event: any) {
              event.stopPropagation()
              onClick?.()
            })
            .on("mouseenter", function() {
              d3.select(this).select(".border")
                .attr("stroke-width", 4)
                .attr("stroke", "#ffffff")
            })
            .on("mouseleave", function() {
              d3.select(this).select(".border")
                .attr("stroke-width", 3)
                .attr("stroke", "#0A2A3C")
            })
        }

        setLoaded(true)
      } catch (error) {
        console.error("Erreur lors du chargement de la carte:", error)
        setLoaded(true)
      }
    }
    draw()
    return () => { cancelled = true }
  }, [topoJsonUrl, width, height, interactive, onClick])

  return (
    <svg 
      ref={ref} 
      width="100%" 
      height="auto" 
      className={className} 
      role="img" 
      aria-label="Carte du Gabon avec drapeau"
    >
      <title>Carte du Gabon - Drapeau National</title>
      {!loaded && (
        <text x="50%" y="50%" textAnchor="middle" fill="#6b7280">
          Chargement de la carte...
        </text>
      )}
    </svg>
  )
}
