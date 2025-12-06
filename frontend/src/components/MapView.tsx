import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import type { Place } from '../types';

// Tula center coordinates
const TULA_CENTER: [number, number] = [54.193122, 37.617348];

function getMarkerIcon(place: Place): L.DivIcon {
  let emoji = '📍';
  let colorClass = 'neutral';
  
  const placeType = place.type?.toLowerCase() || '';
  
  if (placeType.includes('медицин') || placeType.includes('аптек')) {
    emoji = '🏥';
    colorClass = 'positive';
  } else if (placeType.includes('спорт') || placeType.includes('фитнес')) {
    emoji = '🏋️';
    colorClass = 'positive';
  } else if (placeType.includes('магазин') || placeType.includes('торгов')) {
    emoji = '🛒';
    colorClass = place.is_health ? 'positive' : place.is_alcohol ? 'negative' : 'neutral';
  } else if (placeType.includes('еда') || placeType.includes('кафе') || placeType.includes('ресторан')) {
    emoji = '🍽️';
    colorClass = place.is_health ? 'positive' : 'neutral';
  } else if (placeType.includes('транспорт') || placeType.includes('остановк')) {
    emoji = '🚌';
    colorClass = 'neutral';
  } else if (placeType.includes('промышлен') || placeType.includes('завод')) {
    emoji = '🏭';
    colorClass = 'negative';
  } else if (placeType.includes('отход') || placeType.includes('мусор')) {
    emoji = '🗑️';
    colorClass = 'negative';
  } else if (place.is_health) {
    emoji = '💚';
    colorClass = 'positive';
  } else if (place.is_smoke || place.is_alcohol) {
    colorClass = 'negative';
  }

  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${colorClass}">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function MarkerClusterLayer({ places }: { places: Place[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const { setSelectedPlace } = useStore();

  useEffect(() => {
    if (!map) return;

    // Remove existing cluster
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    // Create new cluster group
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      animate: true,
    });

    // Add markers to cluster
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
  const { places, user, setAuthModalOpen } = useStore();

  const handleAddPlace = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    // TODO: Implement add place modal
    alert('Добавление объекта будет доступно в следующей версии');
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={TULA_CENTER}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterLayer places={places} />
      </MapContainer>

      {/* FAB for adding places */}
      <button
        onClick={handleAddPlace}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-[1000]"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
