const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Encodes a coordinate as a geohash, the format Ticketmaster's `geoPoint` filter expects.
 * Each extra character narrows the area; 9 characters is a few meters.
 */
export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision = 9,
): string {
  if (latitude < -90 || latitude > 90) {
    throw new RangeError(`Latitude out of range: ${latitude}`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError(`Longitude out of range: ${longitude}`);
  }

  const lat: [number, number] = [-90, 90];
  const lon: [number, number] = [-180, 180];
  let hash = "";
  let bits = 0;
  let bitCount = 0;
  let evenBit = true; // bits alternate between longitude and latitude, starting with longitude

  while (hash.length < precision) {
    const range = evenBit ? lon : lat;
    const value = evenBit ? longitude : latitude;
    const mid = (range[0] + range[1]) / 2;

    bits <<= 1;
    if (value >= mid) {
      bits |= 1;
      range[0] = mid;
    } else {
      range[1] = mid;
    }

    evenBit = !evenBit;
    if (++bitCount === 5) {
      hash += BASE32[bits];
      bits = 0;
      bitCount = 0;
    }
  }

  return hash;
}
