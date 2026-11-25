import { useCallback, useEffect, useRef, useState } from 'react';

function mapGeolocationError(err) {
  if (!err) return 'Unable to obtain GPS location.';
  switch (err.code) {
    case 1:
      return 'Location permission denied. Please allow GPS access in your browser site settings and retry.';
    case 2:
      return 'GPS position is currently unavailable. Check device location services.';
    case 3:
      return 'GPS request timed out. Move to an open area and retry.';
    default:
      return err.message || 'Geolocation error occurred.';
  }
}

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    stopWatching();
    setError(null);
    setWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ?? 0,
          accuracy: pos.coords.accuracy ?? 0,
          heading: pos.coords.heading ?? 0,
          timestamp: pos.timestamp || Date.now(),
        });
      },
      (err) => {
        setError(mapGeolocationError(err));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );
  }, [stopWatching]);

  useEffect(() => () => stopWatching(), [stopWatching]);

  return {
    position,
    error,
    watching,
    startWatching,
    stopWatching,
  };
}
