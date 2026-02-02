/**
 * IP Geolocation Service - same pattern as KervinApps
 * Uses ip-api.com (primary) and ipapi.co (fallback). Native fetch in Node 18+.
 */
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getGeolocationFromIpApi(ipAddress) {
  try {
    if (!ipAddress || ipAddress === 'unknown' ||
        ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return null;
    }
    const url = `http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,as,query`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.status === 'fail') return null;
      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        postalCode: data.zip || null,
        latitude: data.lat || null,
        longitude: data.lon || null,
        timezone: data.timezone || null,
        isp: data.isp || null,
        asn: data.as || null,
        source: 'ip-api.com',
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getGeolocationFromIpApiCo(ipAddress) {
  try {
    if (!ipAddress || ipAddress === 'unknown' ||
        ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return null;
    }
    const url = `https://ipapi.co/${ipAddress}/json/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.error) return null;
      return {
        country: data.country_name || null,
        region: data.region || null,
        city: data.city || null,
        postalCode: data.postal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timezone: data.timezone || null,
        isp: data.org || null,
        asn: data.asn || null,
        source: 'ipapi.co',
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function getGeolocationFromIP(ipAddress) {
  if (!ipAddress || ipAddress === 'unknown' || ipAddress.trim() === '') return null;

  const cacheKey = ipAddress;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  let geolocation = await getGeolocationFromIpApi(ipAddress);
  if (!geolocation) geolocation = await getGeolocationFromIpApiCo(ipAddress);

  if (geolocation) {
    cache.set(cacheKey, { data: geolocation, timestamp: Date.now() });
  }
  return geolocation;
}

module.exports = { getGeolocationFromIP };
