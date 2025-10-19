import axios from 'axios';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  address: Address;
  confidence: number;
}

export interface ReverseGeocodeResult {
  address: Address;
  formattedAddress: string;
  confidence: number;
}

export interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in minutes
}

export interface NearbySearchOptions {
  coordinates: Coordinates;
  radius: number; // in kilometers
  limit?: number;
  category?: string;
}

export class LocationService {
  private static instance: LocationService;
  private mapboxToken: string | null = null;
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private configure(): void {
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || null;

    if (!this.mapboxToken) {
      console.warn('Mapbox token not configured. Location services will be limited.');
      return;
    }

    this.isConfigured = true;
    console.log('Mapbox location service configured successfully');
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.isConfigured) {
      throw new Error('Location service not configured. Please check Mapbox token.');
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          country: 'za', // Limit to South Africa
          limit: 1,
          types: 'address,place',
        },
        timeout: 10000,
      });

      const features = response.data.features;
      if (!features || features.length === 0) {
        return null;
      }

      const feature = features[0];
      const [longitude, latitude] = feature.center;

      // Parse address components
      const addressComponents = this.parseMapboxAddress(feature);

      return {
        coordinates: { latitude, longitude },
        formattedAddress: feature.place_name,
        address: addressComponents,
        confidence: feature.relevance || 0,
      };
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw new Error('Failed to geocode address');
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<ReverseGeocodeResult | null> {
    if (!this.isConfigured) {
      throw new Error('Location service not configured');
    }

    try {
      const { latitude, longitude } = coordinates;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          country: 'za',
          types: 'address,place',
          limit: 1,
        },
        timeout: 10000,
      });

      const features = response.data.features;
      if (!features || features.length === 0) {
        return null;
      }

      const feature = features[0];
      const addressComponents = this.parseMapboxAddress(feature);

      return {
        address: addressComponents,
        formattedAddress: feature.place_name,
        confidence: feature.relevance || 0,
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  private parseMapboxAddress(feature: any): Address {
    const context = feature.context || [];
    const properties = feature.properties || {};

    // Initialize with defaults
    let street = feature.text || '';
    let city = '';
    let province = '';
    let postalCode = '';
    let country = 'South Africa';

    // Parse context for administrative details
    context.forEach((item: any) => {
      if (item.id.startsWith('postcode')) {
        postalCode = item.text;
      } else if (item.id.startsWith('place')) {
        city = item.text;
      } else if (item.id.startsWith('region')) {
        province = item.text;
      } else if (item.id.startsWith('country')) {
        country = item.text;
      }
    });

    // Handle address number if available
    if (properties.address) {
      street = `${properties.address} ${street}`;
    }

    return {
      street: street.trim(),
      city,
      province,
      postalCode,
      country,
    };
  }

  async calculateDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult> {
    if (!this.isConfigured) {
      // Fallback to haversine formula if Mapbox not configured
      const distance = this.calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.round(distance * 1.5), // Rough estimate: 1.5 min per km
      };
    }

    try {
      const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          geometries: 'geojson',
          overview: 'false',
        },
        timeout: 10000,
      });

      const routes = response.data.routes;
      if (!routes || routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = routes[0];
      return {
        distance: Math.round(route.distance / 1000 * 100) / 100, // Convert m to km, round to 2 decimals
        duration: Math.round(route.duration / 60), // Convert seconds to minutes
      };
    } catch (error) {
      console.error('Distance calculation failed:', error);
      // Fallback to haversine distance
      const distance = this.calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.round(distance * 1.5),
      };
    }
  }

  private calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async validateSouthAfricanAddress(address: Address): Promise<boolean> {
    // Basic validation for South African addresses
    if (address.country.toLowerCase() !== 'south africa') {
      return false;
    }

    // List of valid South African provinces
    const validProvinces = [
      'western cape',
      'eastern cape',
      'northern cape',
      'free state',
      'kwazulu-natal',
      'north west',
      'gauteng',
      'mpumalanga',
      'limpopo',
    ];

    const province = address.province.toLowerCase();
    return validProvinces.includes(province);
  }

  async getNearbyBusinesses(options: NearbySearchOptions): Promise<any[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      const { coordinates, radius, limit = 10, category = 'auto' } = options;
      const radiusInMeters = radius * 1000;

      // Search for nearby auto-related businesses
      const query = category === 'auto' ? 'auto parts scrap yard dismantler' : category;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          proximity: `${coordinates.longitude},${coordinates.latitude}`,
          country: 'za',
          limit,
          types: 'poi',
        },
        timeout: 10000,
      });

      const features = response.data.features || [];

      // Filter by distance
      return features
        .map((feature: any) => {
          const [lng, lat] = feature.center;
          const distance = this.calculateHaversineDistance(
            coordinates,
            { latitude: lat, longitude: lng }
          );

          return {
            name: feature.text,
            category: feature.properties?.category || 'business',
            coordinates: { latitude: lat, longitude: lng },
            address: feature.place_name,
            distance,
          };
        })
        .filter((business: any) => business.distance <= radius)
        .sort((a: any, b: any) => a.distance - b.distance);
    } catch (error) {
      console.error('Nearby search failed:', error);
      return [];
    }
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}

export const locationService = LocationService.getInstance();