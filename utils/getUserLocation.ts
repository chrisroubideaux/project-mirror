// utils/getUserLocation.ts
// utils/getUserLocation.ts

export interface UserLocation {
  city: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  accuracy: "gps" | "ip" | "manual";
}

const IP_API = "https://ipapi.co/json/";
const REVERSE_GEO_API =
  "https://api.bigdatacloud.net/data/reverse-geocode-client";

export async function getUserLocation(): Promise<UserLocation> {
  // -------------------------
  // OPTION A — Browser GPS
  // -------------------------
  const tryGeoGPS = async () => {
    return new Promise<UserLocation>((resolve, reject) => {
      if (!navigator.geolocation) return reject("Geolocation not supported");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            // Reverse lookup → city, region, country
            const lookup = await fetch(
              `${REVERSE_GEO_API}?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            ).then((r) => r.json());

            resolve({
              city: lookup.city || lookup.locality || "",
              region: lookup.principalSubdivision || "",
              country: lookup.countryName || "",
              lat,
              lon,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              accuracy: "gps",
            });
          } catch (err) {
            reject(err);
          }
        },
        () => reject("Permission denied")
      );
    });
  };

  // Attempt GPS first
  try {
    return await tryGeoGPS();
  } catch (err) {
    console.log("GPS failed → trying IP lookup...", err);
  }

  // -------------------------
  // OPTION B — IP-based lookup
  // -------------------------
  try {
    const res = await fetch(IP_API);
    const data = await res.json();

    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone,
      accuracy: "ip",
    };
  } catch (err) {
    console.log("IP lookup failed → asking manually...", err);
  }

  // -------------------------
  // OPTION C — User input
  // -------------------------
  const manualCity = typeof window !== "undefined"
    ? prompt("What city are you in? (for time-based greeting)")
    : "Unknown";

  return {
    city: manualCity || "Unknown",
    region: "",
    country: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    accuracy: "manual",
  };
}
