export function isValidLatLng(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isValidTimeHHMM(value) {
  if (typeof value !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.trim().split(':').map(Number);
  return h * 60 + m;
}

export function validateBus(bus, existingBuses = {}, editingBusId = null) {
  const errors = {};
  const number = (bus?.number || '').trim();
  const name = (bus?.name || '').trim();
  const routeId = (bus?.routeId || '').trim();
  const capacity = bus?.capacity;

  if (!number) {
    errors.number = 'Bus number is required.';
  } else if (number.length < 4 || number.length > 15) {
    errors.number = 'Bus number must be 4–15 characters.';
  } else {
    const duplicate = Object.entries(existingBuses || {}).some(
      ([id, item]) =>
        id !== editingBusId &&
        (item?.number || '').trim().toLowerCase() === number.toLowerCase()
    );
    if (duplicate) {
      errors.number = 'Bus number must be unique.';
    }
  }

  if (!name) {
    errors.name = 'Bus name is required.';
  } else if (name.length < 2 || name.length > 40) {
    errors.name = 'Bus name must be 2–40 characters.';
  }

  if (!routeId) {
    errors.routeId = 'Assigned route is required.';
  }

  if (capacity !== undefined && capacity !== '' && capacity !== null) {
    const capNum = Number(capacity);
    if (!Number.isInteger(capNum) || capNum < 1 || capNum > 200) {
      errors.capacity = 'Capacity must be a whole number between 1 and 200.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRoute(route) {
  const errors = {};
  const name = (route?.name || '').trim();
  const path = Array.isArray(route?.path) ? route.path : [];

  if (!name) {
    errors.name = 'Route name is required.';
  } else if (name.length < 3 || name.length > 60) {
    errors.name = 'Route name must be 3–60 characters.';
  }

  if (path.length < 2) {
    errors.path = 'Route path must contain at least 2 points.';
  } else if (!path.every((pt) => isValidLatLng(Number(pt.lat), Number(pt.lng)))) {
    errors.path = 'All route path points must have valid lat/lng coordinates.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStop(stop) {
  const errors = {};
  const name = (stop?.name || '').trim();
  const lat = Number(stop?.lat);
  const lng = Number(stop?.lng);

  if (!name) {
    errors.name = 'Stop name is required.';
  } else if (name.length < 2 || name.length > 60) {
    errors.name = 'Stop name must be 2–60 characters.';
  }

  if (!isValidLatLng(lat, lng) || stop?.lat === '' || stop?.lng === '' || stop?.lat == null || stop?.lng == null) {
    errors.coords = 'Latitude (-90..90) and longitude (-180..180) must be valid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSchedule(stopIds = [], scheduleMap = {}) {
  const errors = {};
  if (!Array.isArray(stopIds) || stopIds.length === 0) {
    errors.general = 'Route has no stops to schedule.';
    return { valid: false, errors };
  }

  let prevMinutes = -1;
  for (const stopId of stopIds) {
    const timeStr = scheduleMap?.[stopId];
    if (!isValidTimeHHMM(timeStr)) {
      errors[stopId] = 'Use valid 24-hour HH:mm format.';
      continue;
    }
    const mins = toMinutes(timeStr);
    if (prevMinutes !== -1 && mins <= prevMinutes) {
      errors[stopId] = 'Schedule times must strictly increase along the route.';
    }
    prevMinutes = mins;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
