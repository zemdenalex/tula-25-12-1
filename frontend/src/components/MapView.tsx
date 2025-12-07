import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '../store';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (isSelected: boolean, isHealth: boolean) => {
  const color = isHealth ? '#10B981' : '#3B82F6';
  const size = isSelected ? 40 : 32;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

interface MapViewProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  selectedPlace: Place | null;
}

const MapController: React.FC<{ selectedPlace: Place | null }> = ({ selectedPlace }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedPlace) {
      map.setView([selectedPlace.coord1, selectedPlace.coord2], 16, { animate: true });
    }
  }, [selectedPlace, map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({ places, onPlaceSelect, selectedPlace }) => {
  const defaultCenter: [number, number] = [54.193122, 37.617348];
  
  const visiblePlaces = useMemo(() => {
    return places.slice(0, 200);
  }, [places]);

  const markers = useMemo(() => {
    return visiblePlaces.map((place) => (
      <Marker
        key={place.id}
        position={[place.coord1, place.coord2]}
        icon={createCustomIcon(
          selectedPlace?.id === place.id,
          place.is_health || false
        )}
        eventHandlers={{
          click: () => onPlaceSelect(place),
        }}
      >
        <Popup>
          <div className="p-2 min-w-[200px]">
            <h3 className="font-bold text-gray-900">{place.name || 'Без названия'}</h3>
            {place.type && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {place.type}
              </span>
            )}
            {place.rating && place.rating > 0 && (
              <div className="mt-1 text-xs text-gray-600">
                Здоровье: {place.rating}%
              </div>
            )}
            {place.info && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{place.info}</p>
            )}
            <button
              onClick={() => onPlaceSelect(place)}
              className="mt-2 w-full py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Подробнее
            </button>
          </div>
        </Popup>
      </Marker>
    ));
  }, [visiblePlaces, selectedPlace, onPlaceSelect]);
  
  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController selectedPlace={selectedPlace} />
      
      {markers}
    </MapContainer>
  );
};

export default MapView;