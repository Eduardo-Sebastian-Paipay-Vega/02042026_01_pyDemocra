/**
 * Utilitario de Geolocalización y Geofencing por Fórmula de Haversine
 * (Módulos M05 Asistencias & M04 Proyectos y Eventos / RF-028, RF-033).
 */

const EARTH_RADIUS_METERS = 6371000; // Radio medio de la Tierra en metros

/**
 * Convierte grados sexagesimales a radianes.
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula la distancia en metros entre dos coordenadas GPS (latitud/longitud)
 * utilizando la fórmula de Haversine.
 *
 * @param {number} lat1 - Latitud del punto A.
 * @param {number} lon1 - Longitud del punto A.
 * @param {number} lat2 - Latitud del punto B.
 * @param {number} lon2 - Longitud del punto B.
 * @returns {number} Distancia en metros (redondeada a 2 decimales).
 */
export function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (![nLat1, nLon1, nLat2, nLon2].every(Number.isFinite)) {
    throw new Error("Todas las coordenadas de latitud y longitud deben ser numeros validos.");
  }

  const dLat = toRadians(nLat2 - nLat1);
  const dLon = toRadians(nLon2 - nLon1);

  const phi1 = toRadians(nLat1);
  const phi2 = toRadians(nLat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return Math.round(distanceMeters * 100) / 100;
}

/**
 * Evalúa si las coordenadas del usuario están dentro del radio de geocerca permitido
 * para confirmar marcaciones de asistencia o check-in en sedes y eventos.
 *
 * @param {Object} options
 * @param {number} options.userLat - Latitud GPS transmitida por el dispositivo.
 * @param {number} options.userLng - Longitud GPS transmitida por el dispositivo.
 * @param {number} options.targetLat - Latitud de la sede u evento.
 * @param {number} options.targetLng - Longitud de la sede u evento.
 * @param {number} [options.maxRadiusMeters=100] - Radio máximo permitido en metros (por defecto 100m).
 * @returns {Object} Resultado de la validación de geofencing.
 */
export function isWithinGeofence({
  userLat,
  userLng,
  targetLat,
  targetLng,
  maxRadiusMeters = 100,
}) {
  const distanceMeters = calculateHaversineDistanceMeters(
    userLat,
    userLng,
    targetLat,
    targetLng
  );

  const allowed = distanceMeters <= maxRadiusMeters;

  return {
    allowed,
    distanceMeters,
    maxRadiusMeters,
    userCoordinates: { lat: Number(userLat), lng: Number(userLng) },
    targetCoordinates: { lat: Number(targetLat), lng: Number(targetLng) },
    message: allowed
      ? `Dentro del radio permitido (${distanceMeters}m <= ${maxRadiusMeters}m).`
      : `Fuera del radio permitido. Distancia actual: ${distanceMeters}m (Maximo: ${maxRadiusMeters}m).`,
  };
}
