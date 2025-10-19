import express from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { z } from 'zod';
import axios from 'axios';

const router = express.Router();

// Mapbox API configuration
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// Validation schemas
const geocodeSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.string().optional(),
  country: z.string().optional(),
});

const reverseGeocodeSchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
});

// Geocode location (address to coordinates) - PUBLIC endpoint
router.get('/geocode', async (req, res, next) => {
  try {
    const validatedQuery = geocodeSchema.parse(req.query);

    if (!MAPBOX_ACCESS_TOKEN) {
      // Fallback to mock data if Mapbox is not configured
      console.warn('Mapbox API token not configured, using mock data');

      const mockResults = [
        {
          place_name: `${validatedQuery.q}, South Africa`,
          center: [18.4241, -33.9249], // Cape Town coordinates
          place_type: ['place'],
          properties: {
            type: 'city',
          },
        },
      ];

      const response: ApiResponse<{ results: typeof mockResults }> = {
        success: true,
        data: { results: mockResults },
        message: 'Geocoding completed (mock data)',
      };

      return res.json(response);
    }

    // Call Mapbox Geocoding API
    const limit = parseInt(validatedQuery.limit || '5');
    const country = validatedQuery.country || 'za'; // Default to South Africa

    const mapboxUrl = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(validatedQuery.q)}.json`;
    const mapboxResponse = await axios.get(mapboxUrl, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        country,
        limit,
        types: 'place,locality,neighborhood,address',
      },
      timeout: 5000,
    });

    const results = mapboxResponse.data.features.map((feature: any) => ({
      place_name: feature.place_name,
      center: feature.center, // [lng, lat]
      place_type: feature.place_type,
      properties: {
        type: feature.properties.type || feature.place_type[0],
        ...feature.properties,
      },
    }));

    const response: ApiResponse<{ results: typeof results }> = {
      success: true,
      data: { results },
      message: 'Geocoding completed successfully',
    };

    res.json(response);
  } catch (error: any) {
    // Fallback to mock data on error
    console.error('Geocoding error:', error.message);

    const mockResults = [
      {
        place_name: `${req.query.q}, South Africa`,
        center: [18.4241, -33.9249],
        place_type: ['place'],
        properties: {
          type: 'city',
        },
      },
    ];

    const response: ApiResponse<{ results: typeof mockResults }> = {
      success: true,
      data: { results: mockResults },
      message: 'Geocoding completed with fallback data',
    };

    res.json(response);
  }
});

// Reverse geocode (coordinates to address) - PUBLIC endpoint
router.get('/reverse-geocode', async (req, res, next) => {
  try {
    const validatedQuery = reverseGeocodeSchema.parse(req.query);
    const lat = parseFloat(validatedQuery.lat);
    const lng = parseFloat(validatedQuery.lng);

    if (!MAPBOX_ACCESS_TOKEN) {
      // Fallback to mock data if Mapbox is not configured
      console.warn('Mapbox API token not configured, using mock data');

      const mockData = {
        place_name: 'Cape Town, Western Cape, South Africa',
        properties: {
          province: 'Western Cape',
          city: 'Cape Town',
          suburb: 'City Bowl',
        },
      };

      const response: ApiResponse<typeof mockData> = {
        success: true,
        data: mockData,
        message: 'Reverse geocoding completed (mock data)',
      };

      return res.json(response);
    }

    // Call Mapbox Reverse Geocoding API
    const mapboxUrl = `${MAPBOX_GEOCODING_URL}/${lng},${lat}.json`;
    const mapboxResponse = await axios.get(mapboxUrl, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        types: 'place,locality,neighborhood,address',
      },
      timeout: 5000,
    });

    const feature = mapboxResponse.data.features[0];

    if (!feature) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Location not found',
        message: 'No address found for these coordinates',
      };
      return res.status(404).json(response);
    }

    // Extract location components
    const context = feature.context || [];
    const properties: any = {
      suburb: feature.text,
    };

    context.forEach((item: any) => {
      if (item.id.startsWith('place.')) {
        properties.city = item.text;
      } else if (item.id.startsWith('region.')) {
        properties.province = item.text;
      } else if (item.id.startsWith('country.')) {
        properties.country = item.text;
      }
    });

    const result = {
      place_name: feature.place_name,
      properties,
    };

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Reverse geocoding completed successfully',
    };

    res.json(response);
  } catch (error: any) {
    // Fallback to mock data on error
    console.error('Reverse geocoding error:', error.message);

    const mockData = {
      place_name: 'South Africa',
      properties: {
        province: 'Western Cape',
        city: 'Cape Town',
        suburb: 'Unknown',
      },
    };

    const response: ApiResponse<typeof mockData> = {
      success: true,
      data: mockData,
      message: 'Reverse geocoding completed with fallback data',
    };

    res.json(response);
  }
});

// Calculate distance between two points (Haversine formula)
router.get('/distance', async (req, res, next) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing parameters',
        message: 'lat1, lng1, lat2, and lng2 are required',
      };
      return res.status(400).json(response);
    }

    const point1 = {
      lat: parseFloat(lat1 as string),
      lng: parseFloat(lng1 as string),
    };

    const point2 = {
      lat: parseFloat(lat2 as string),
      lng: parseFloat(lng2 as string),
    };

    const distance = calculateDistance(point1, point2);

    const response: ApiResponse<{ distance: number; unit: string }> = {
      success: true,
      data: {
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        unit: 'km',
      },
      message: 'Distance calculated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get South African provinces list - PUBLIC endpoint
router.get('/provinces', async (req, res, next) => {
  try {
    const provinces = [
      'Eastern Cape',
      'Free State',
      'Gauteng',
      'KwaZulu-Natal',
      'Limpopo',
      'Mpumalanga',
      'Northern Cape',
      'North West',
      'Western Cape',
    ];

    const response: ApiResponse<string[]> = {
      success: true,
      data: provinces,
      message: 'Provinces retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get major cities by province - PUBLIC endpoint
router.get('/cities', async (req, res, next) => {
  try {
    const province = req.query.province as string;

    const citiesByProvince: Record<string, string[]> = {
      'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'George', 'Worcester'],
      'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Benoni', 'Boksburg', 'Germiston', 'Krugersdorp', 'Randburg', 'Roodepoort', 'Sandton'],
      'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Newcastle', 'Richards Bay', 'Port Shepstone'],
      'Eastern Cape': ['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown', 'Uitenhage'],
      'Free State': ['Bloemfontein', 'Welkom', 'Bethlehem', 'Kroonstad', 'Sasolburg'],
      'Limpopo': ['Polokwane', 'Tzaneen', 'Thohoyandou', 'Mokopane', 'Lebowakgomo'],
      'Mpumalanga': ['Nelspruit', 'Witbank', 'Middelburg', 'Secunda', 'Ermelo'],
      'Northern Cape': ['Kimberley', 'Upington', 'Kuruman', 'Springbok', 'De Aar'],
      'North West': ['Rustenburg', 'Mahikeng', 'Klerksdorp', 'Potchefstroom', 'Brits'],
    };

    let cities: string[] = [];

    if (province && citiesByProvince[province]) {
      cities = citiesByProvince[province];
    } else {
      // Return all cities if no province specified
      cities = Object.values(citiesByProvince).flat().sort();
    }

    const response: ApiResponse<string[]> = {
      success: true,
      data: cities,
      message: 'Cities retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Helper function: Calculate distance between two points using Haversine formula
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;
