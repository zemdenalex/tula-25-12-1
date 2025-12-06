import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useStore } from '../store';
import type { Place } from '../types';

const TULA_CENTER: [number, number] = [54.193122, 37.617348];
const DEFAULT_ZOOM = 13;

function getMarkerIcon(place: Place) {
  const isHealthy = place.is_health || place.type === 'Спортивные объекты';
  const isHarmful = place.is_alcohol || place.is_smoke;
  
  let emoji = '📍';
  let borderColor = '#3b82f6';
  
  if (place.type?.includes('Медицин')) {
    emoji = '🏥';
    borderColor = '#22c55e';
  } else if (place.type?.includes('Спорт')) {
    emoji = '🏋️';
    borderColor = '#22c55e';
  } else if (place.type?.includes('Магазин')) {
    emoji = '🛒';
    borderColor = place.is_health ? '#22c55e' : (place.is_alcohol ? '#ef4444' : '#f59e0b');
  } else if (place.type?.includes('Питани')) {
    emoji = '🍽️';
    borderColor = place.is_alcohol ? '#ef4444' : '#f59e0b';
  } else if (place.type?.includes('Остановк')) {
    emoji = '🚌';
  } else if (place.type?.includes('Промышлен')) {
    emoji = '🏭';
    borderColor = '#ef4444';
  } else if (place.type?.includes('мусор')) {
    emoji = '🗑️';
  }
  
  return L.divIcon({
    html: `<div class="custom-marker" style="border-color: ${borderColor}">${emoji}</div>`,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function MarkerClusterGroup() {
  const map = useMap();
  const { places, setSelectedPlace } = useStore();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    places.forEach((place) => {
      if (place.coord1 && place.coord2) {
        const marker = L.marker([place.coord1, place.coord2], {
          icon: getMarkerIcon(place),
        });
        
        marker.on('click', () => {
          setSelectedPlace(place);
        });
        
        cluster.addLayer(marker);
      }
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, places, setSelectedPlace]);

  return null;
}

export default function MapView() {
  const { isLoading } = useStore();

  return (
    <div className="h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-[1000] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <MapContainer
        center={TULA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup />
      </MapContainer>
      
      <AddButton />
    </div>
  );
}

function AddButton() {
  const { user, setAuthModalOpen } = useStore();
  
  const handleAdd = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    alert('Добавление объекта — в разработке');
  };

  return (
    <button
      onClick={handleAdd}
      className="absolute bottom-24 right-4 z-[1000] w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
      aria-label="Добавить объект"
    >
      <span className="text-2xl">+</span>
    </button>
  );
}
