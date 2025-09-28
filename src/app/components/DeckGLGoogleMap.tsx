"use client";

import React, { useEffect, useRef } from "react";
import { ScatterplotLayer, LineLayer, TextLayer } from "@deck.gl/layers";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";

// Type definition for data points
interface DataPoint {
  name: string;
  coordinates: [number, number];
  size: number;
}

// Type definition for connections
interface ConnectionData {
  source: [number, number];
  target: [number, number];
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

// Function to calculate distance between two points in kilometers
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate connections between all points
const connections: ConnectionData[] = [];
for (let i = 0; i < data.length; i++) {
  for (let j = i + 1; j < data.length; j++) {
    const distance = calculateDistance(data[i].coordinates, data[j].coordinates);
    connections.push({
      source: data[i].coordinates,
      target: data[j].coordinates,
      distance: Math.round(distance),
      midpoint: [
        (data[i].coordinates[0] + data[j].coordinates[0]) / 2,
        (data[i].coordinates[1] + data[j].coordinates[1]) / 2
      ] as [number, number]
    });
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function DeckGLGoogleMap() {
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
          id: "scatterplot-layer",
          data,
          pickable: true,
          opacity: 1,
          filled: true,
          radiusScale: 10,
          radiusMinPixels: 10,
          radiusMaxPixels: 100,
          getPosition: (d) => d.coordinates,
          getRadius: (d) => d.size,
          getFillColor: [255, 140, 0, 200],
          getLineColor: [0, 0, 0, 255],
          onClick: (info) => {
            if (info.object) {
              alert(`${info.object.name}\n(${info.object.coordinates})`);
            }
          }
        });

        // Text layer for point labels
        const textLayer = new TextLayer({
          id: "text-layer",
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

        // Line layer for connections
        const lineLayer = new LineLayer({
          id: "line-layer",
          data: connections,
          pickable: false,
          getSourcePosition: (d: ConnectionData) => d.source,
          getTargetPosition: (d: ConnectionData) => d.target,
          getColor: [255, 255, 255, 150],
          getWidth: 2,
          widthUnits: "pixels"
        });

        // Text layer for distance labels
        const distanceTextLayer = new TextLayer({
          id: "distance-text-layer",
          data: connections,
          pickable: false,
          getPosition: (d: ConnectionData) => d.midpoint,
          getText: (d: ConnectionData) => `${d.distance} km`,
          getSize: 12,
          getAngle: 0,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getColor: [255, 255, 255, 255],
          getBackgroundColor: [0, 0, 0, 180],
          background: true,
          backgroundPadding: [1, 1, 1, 1],
          fontFamily: "Arial, sans-serif",
          fontWeight: "normal"
        });

        // Attach deck.gl overlay with all layers
        const overlay = new GoogleMapsOverlay({
          layers: [lineLayer, scatterLayer, textLayer, distanceTextLayer]
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
        <p>The current API key is only enabled for Maps Embed API (iframes).</p>
        <p><strong>To use deck.gl with Google Maps, you need to:</strong></p>
        <ol style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>Go to <a href="https://console.cloud.google.com/apis/library" target="_blank">Google Cloud Console</a></li>
          <li>Enable the <strong>"Maps JavaScript API"</strong> (not just Embed API)</li>
          <li>Update your API key or create a new one with JavaScript API access</li>
          <li>The API key is already set in .env.local file</li>
        </ol>
        <p style={{ fontSize: '12px', marginTop: '15px' }}>
          For now, check out the standalone deck.gl examples below that work without Google Maps.
        </p>
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
          <p>Loading Google Maps...</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            API key is set. Waiting for Google Maps to load...
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