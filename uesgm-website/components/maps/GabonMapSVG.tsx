"use client"
import React, { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"

type Props = {
  topoJsonUrl?: string // ex: "/data/gabon.topojson"
  width?: number
  height?: number
  className?: string
  interactive?: boolean
  onClick?: () => void
}

export default function GabonMapSVG({ 
  topoJsonUrl = "/data/gabon.topojson", 
  width = 800, 
  height = 600, 
  className = "",
  interactive = false,
  onClick
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [pathData, setPathData] = useState<string>("")

  useEffect(() => {
    let cancelled = false
    async function draw() {
      try {
        const res = await fetch(topoJsonUrl)
        const topo = await res.json()
        const geo = feature(topo, topo.objects[Object.keys(topo.objects)[0]]) as any

        // Projection : WebMercator optimisée pour le Gabon
        const projection = d3.geoMercator()
          .center([11.8, -0.8]) // Centre du Gabon
          .scale(width * 4)
          .translate([width / 2, height / 2])

        const path = d3.geoPath().projection(projection)
        const d = path(geo) || ""

        const svg = d3.select(ref.current)
        svg.selectAll("*").remove()

        // Configuration SVG
        svg
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet")

        // Groupe principal
        const g = svg.append("g")
          .attr("class", "gabon-map")

        // Path du Gabon
        g.append("path")
          .datum(geo)
          .attr("d", path as any)
          .attr("fill", interactive ? "#10b981" : "#e6f4ea")
          .attr("stroke", "#059669")
          .attr("stroke-width", 2)
          .attr("class", "gabon-path")
          .style("cursor", interactive ? "pointer" : "default")
          .style("transition", "all 0.3s ease")

        // Animation au survol si interactif
        if (interactive) {
          g.select(".gabon-path")
            .on("mouseenter", function() {
              d3.select(this)
                .attr("fill", "#059669")
                .attr("stroke-width", 3)
            })
            .on("mouseleave", function() {
              d3.select(this)
                .attr("fill", "#10b981")
                .attr("stroke-width", 2)
            })
            .on("click", function(event) {
              event.stopPropagation()
              onClick?.()
            })
        }

        // Ajouter les villes principales
        const cities = [
          { name: "Libreville", coords: [9.45, -0.39], pop: "703k" },
          { name: "Port-Gentil", coords: [8.78, -0.63], pop: "134k" },
          { name: "Franceville", coords: [13.58, -1.63], pop: "124k" },
          { name: "Oyem", coords: [11.58, 2.33], pop: "60k" },
          { name: "Mouila", coords: [11.05, -1.87], pop: "36k" }
        ]

        // Points des villes
        g.selectAll(".city")
          .data(cities)
          .enter()
          .append("circle")
          .attr("class", "city")
          .attr("cx", d => projection(d.coords as [number, number])![0])
          .attr("cy", d => projection(d.coords as [number, number])![1])
          .attr("r", 4)
          .attr("fill", "#fbbf24")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)

        // Labels des villes
        g.selectAll(".city-label")
          .data(cities)
          .enter()
          .append("text")
          .attr("class", "city-label")
          .attr("x", d => projection(d.coords as [number, number])![0] + 8)
          .attr("y", d => projection(d.coords as [number, number])![1] + 4)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "#1f2937")
          .text(d => d.name)

        setPathData(d)
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
      aria-label="Carte du Gabon"
    >
      <title>Carte du Gabon</title>
      {!loaded && (
        <text x="50%" y="50%" textAnchor="middle" fill="#6b7280">
          Chargement de la carte...
        </text>
      )}
    </svg>
  )
}
