"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Deal } from "@/lib/store";

interface DealMapProps {
  deals: any[];
  center: { lat: number; lng: number };
  onDealClick: (deal: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function DealMap({ deals, center, onDealClick, onMapClick }: DealMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([center.lat, center.lng], 14);

      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
      markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      userMarkerRef.current = L.marker([center.lat, center.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      
      mapInstanceRef.current.on('click', (e) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  
  // Handle center updates
  useEffect(() => {
    if (mapInstanceRef.current && userMarkerRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng]);
      userMarkerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [center.lat, center.lng]);

  // Handle tile layer change
  useEffect(() => {
    if (tileLayerRef.current) {
      const url = isSatellite 
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      tileLayerRef.current.setUrl(url);
    }
  }, [isSatellite]);
  
  // Handle deals update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    
    markersGroupRef.current.clearLayers();
    
    deals.forEach((deal) => {
      const dealIcon = L.divIcon({
        className: 'custom-deal-marker bg-transparent border-none',
        html: `<div class="w-10 h-10 bg-[#FF6B35] text-white rounded-full flex flex-col items-center justify-center font-bold text-xs border-2 border-white shadow-md transform transition-transform hover:scale-110 cursor-pointer">
                 <span class="leading-none text-sm">${deal.discount_pct}%</span>
                 <span class="leading-none text-[8px] uppercase opacity-90 mt-0.5">Off</span>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });
      
      const marker = L.marker([deal.latitude, deal.longitude], { icon: dealIcon });
      
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 min-w-[160px]';
      
      const verifiedBadge = deal.stores?.verified ? `
        <span class="text-blue-500 inline-block align-middle ml-1" title="Verified Retailer">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </span>` : '';
        
      popupContent.innerHTML = `
        <h3 class="font-bold text-gray-900 text-lg m-0 mb-1 leading-tight flex items-center">${deal.store_name} ${verifiedBadge}</h3>
        <p class="text-sm text-gray-600 m-0 mb-1 line-clamp-1">${deal.product_name}</p>
        <p class="text-[#FF6B35] font-bold text-sm m-0 mb-3">${deal.discount_pct}% OFF</p>
      `;
      
      const btnContainer = document.createElement('div');
      const btn = document.createElement('button');
      btn.className = 'w-full bg-[#FF6B35] text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-[#e05a2b] transition-colors shadow-sm';
      btn.innerText = 'View Deal';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDealClick(deal);
      };
      
      btnContainer.appendChild(btn);
      popupContent.appendChild(btnContainer);
      
      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-popup'
      });
      
      marker.addTo(markersGroupRef.current!);
    });
  }, [deals, onDealClick]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[#e5e7eb] shadow-sm relative z-0">
      <div ref={mapRef} className="w-full h-full relative z-0" style={{ zIndex: 0 }} />
      <button 
        onClick={() => setIsSatellite(!isSatellite)}
        className="absolute bottom-4 left-4 z-[400] bg-white text-gray-700 px-3 py-2 rounded-lg shadow-lg font-semibold text-xs hover:bg-gray-50 border border-gray-200 transition-all flex items-center gap-2"
        style={{ zIndex: 1000 }} // Leaflet controls are at z-index 1000
      >
        {isSatellite ? '🗺️ Map View' : '🛰️ Satellite'}
      </button>
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { background: #FFF8F0; z-index: 0 !important; }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 12px; padding: 4px; border: 1px solid #f3f4f6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        .custom-popup .leaflet-popup-tip { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; border-radius: 8px !important; overflow: hidden; }
        .leaflet-control-zoom a { color: #4b5563 !important; }
        .leaflet-control-zoom a:hover { background-color: #f9fafb !important; color: #111827 !important; }
        .custom-deal-marker { background: transparent; border: none; }
      `}} />
    </div>
  );
}
