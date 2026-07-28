import {
  calculateHaversineDistanceMeters,
  isWithinGeofence,
} from "./geofencing.js";

describe("Modulos M05 / M04: Geolocalizacion y Geofencing GPS (server/utils/geofencing.js)", () => {
  // Coordenadas de prueba: Plaza Mayor de Lima (-12.046374, -77.042793)
  const plazaMayorLat = -12.046374;
  const plazaMayorLng = -77.042793;

  test("calcula distancia 0 metros para coordenadas identicas", () => {
    const dist = calculateHaversineDistanceMeters(
      plazaMayorLat,
      plazaMayorLng,
      plazaMayorLat,
      plazaMayorLng
    );
    expect(dist).toBe(0);
  });

  test("calcula correctamente la distancia en metros entre dos puntos GPS", () => {
    // Punto A: Plaza Mayor (-12.046374, -77.042793)
    // Punto B: ~50 metros al norte (-12.045924, -77.042793)
    const dist = calculateHaversineDistanceMeters(
      plazaMayorLat,
      plazaMayorLng,
      -12.045924,
      plazaMayorLng
    );

    expect(dist).toBeGreaterThan(45);
    expect(dist).toBeLessThan(55);
  });

  test("permite marcacion cuando el usuario esta DENTRO del radio de geocerca (<= 100m)", () => {
    const validation = isWithinGeofence({
      userLat: -12.046400,
      userLng: -77.042800,
      targetLat: plazaMayorLat,
      targetLng: plazaMayorLng,
      maxRadiusMeters: 100,
    });

    expect(validation.allowed).toBe(true);
    expect(validation.distanceMeters).toBeLessThan(100);
  });

  test("rechaza marcacion cuando el usuario esta FUERA del radio de geocerca (> 100m)", () => {
    // Punto lejano ~1.5 km
    const validation = isWithinGeofence({
      userLat: -12.060000,
      userLng: -77.042793,
      targetLat: plazaMayorLat,
      targetLng: plazaMayorLng,
      maxRadiusMeters: 100,
    });

    expect(validation.allowed).toBe(false);
    expect(validation.distanceMeters).toBeGreaterThan(1000);
  });
});
