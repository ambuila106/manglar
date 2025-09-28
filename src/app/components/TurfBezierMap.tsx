"use client";

import React, { useEffect, useRef } from "react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import * as turf from "@turf/turf";

// Type definition for data points
interface DataPoint {
  name: string;
  coordinates: [number, number];
  size: number;
}

// Type definition for bezier curves
interface BezierCurve {
  path: [number, number][];
  distance: number;
  midpoint: [number, number];
}

// Sample data points in rural Mexico - focused on Sinaloa region
const data: DataPoint[] = [
  { name: "Culiacán Valle", coordinates: [-107.3943, 24.8091], size: 120 },
  { name: "Los Mochis", coordinates: [-108.9921, 25.7933], size: 100 },
  { name: "Mazatlán Agricultural", coordinates: [-106.4245, 23.2494], size: 110 },
  { name: "Navolato", coordinates: [-107.7008, 24.7669], size: 90 }
];

// Function to create Bezier curve between two points using Turf.js
function createBezierCurve(start: [number, number], end: [number, number]): [number, number][] {
  const startPoint = turf.point(start);
  const endPoint = turf.point(end);
  
  // Calculate distance and bearing for control points
  const distance = turf.distance(startPoint, endPoint, { units: 'kilometers' });
  const bearing = turf.bearing(startPoint, endPoint);
  
  // Create control points for Bezier curve (offset perpendicular to the line)
  const offsetDistance = distance * 0.3; // 30% of total distance for curve height
  
  // Create control point perpendicular to the line
  const controlPoint1 = turf.destination(
    turf.along(turf.lineString([start, end]), distance * 0.25, { units: 'kilometers' }),
    offsetDistance,
    bearing + 90,
    { units: 'kilometers' }
  );
  
  const controlPoint2 = turf.destination(
    turf.along(turf.lineString([start, end]), distance * 0.75, { units: 'kilometers' }),
    offsetDistance,
    bearing + 90,
    { units: 'kilometers' }
  );

  // Generate points along the Bezier curve
  const numPoints = 50;
  const curvePoints: [number, number][] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const bezierPoint = calculateBezierPoint(
      start,
      controlPoint1.geometry.coordinates as [number, number],
      controlPoint2.geometry.coordinates as [number, number],
      end,
      t
    );
    curvePoints.push(bezierPoint);
  }
  
  return curvePoints;
}

// Cubic Bezier calculation
function calculateBezierPoint(
  p0: [number, number],
  p1: [number, number], 
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  
  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];
  
  return [x, y];
}

// Generate Bezier curves between all points
const bezierCurves: BezierCurve[] = [];
for (let i = 0; i < data.length; i++) {
  for (let j = i + 1; j < data.length; j++) {
    const curvePoints = createBezierCurve(data[i].coordinates, data[j].coordinates);
    const distance = turf.distance(
      turf.point(data[i].coordinates),
      turf.point(data[j].coordinates),
      { units: 'kilometers' }
    );
    
    bezierCurves.push({
      path: curvePoints,
      distance: Math.round(distance),
      midpoint: curvePoints[Math.floor(curvePoints.length / 2)]
    });
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function TurfBezierMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    // Check if we're in the browser and Google Maps is available
    if (typeof window === 'undefined' || !mapRef.current) return;
    
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        initializeMap();
      } else {
        // Google Maps not loaded yet, try again in 100ms
        setTimeout(checkGoogleMaps, 100);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        // Initialize Google Map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 24.5000, lng: -107.5000 }, // Sinaloa region
          zoom: 9,
          mapTypeId: "satellite",
          gestureHandling: "greedy",
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false
        });

        // Define deck.gl layers
        const scatterLayer = new ScatterplotLayer<DataPoint>({
          id: "turf-scatterplot-layer",
          data,
          pickable: true,
          opacity: 1,
          filled: true,
          radiusScale: 10,
          radiusMinPixels: 10,
          radiusMaxPixels: 100,
          getPosition: (d) => d.coordinates,
          getRadius: (d) => d.size,
          getFillColor: [0, 255, 140, 200], // Different color - green
          getLineColor: [0, 0, 0, 255],
          onClick: (info) => {
            if (info.object) {
              alert(`${info.object.name}\n(${info.object.coordinates})`);
            }
          }
        });

        // Text layer for point labels
        const textLayer = new TextLayer({
          id: "turf-text-layer",
          data,
          pickable: false,
          getPosition: (d: DataPoint) => d.coordinates,
          getText: (d: DataPoint) => d.name,
          getSize: 16,
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "bottom",
          getColor: [255, 255, 255, 255],
          getBackgroundColor: [0, 0, 0, 128],
          background: true,
          backgroundPadding: [2, 2, 2, 2],
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold"
        });

        // Path layer for Bezier curves
        const pathLayer = new PathLayer({
          id: "turf-bezier-layer",
          data: bezierCurves,
          pickable: false,
          widthScale: 3,
          widthMinPixels: 2,
          getPath: (d: BezierCurve) => d.path,
          getColor: [0, 255, 140, 180], // Green color to match points
          getWidth: 1
        });

        // Text layer for distance labels on curves
        const distanceTextLayer = new TextLayer({
          id: "turf-distance-text-layer",
          data: bezierCurves,
          pickable: false,
          getPosition: (d: BezierCurve) => d.midpoint,
          getText: (d: BezierCurve) => `${d.distance} km`,
          getSize: 12,
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getColor: [255, 255, 255, 255],
          getBackgroundColor: [0, 100, 0, 180],
          background: true,
          backgroundPadding: [1, 1, 1, 1],
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal"
        });

        // Attach deck.gl overlay with all layers
        const overlay = new GoogleMapsOverlay({ 
          layers: [pathLayer, scatterLayer, textLayer, distanceTextLayer] 
        });
        overlay.setMap(map);
      } catch (error) {
        console.error('Google Maps error:', error);
        setHasError(true);
      }
    };

    checkGoogleMaps();
  }, []);

  if (hasError) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        color: '#856404'
      }}>
        <h3>⚠️ Google Maps API Configuration Needed</h3>
        <p>Please enable the Maps JavaScript API in Google Cloud Console.</p>
      </div>
    );
  }

  return (
    <div>
      {!isLoaded && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          <p>Loading Turf.js Bezier Map...</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Enhanced with curved connections using Turf.js geometry
          </p>
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "8px",
          backgroundColor: isLoaded ? 'transparent' : '#f5f5f5'
        }}
      />
    </div>
  );
}