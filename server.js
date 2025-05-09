import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// API KEYS
const TICKETMASTER_API_KEY = "mPLzpIXal7XLK2mMxFTQgaPOEQMiGRAY";
const EVENTBRITE_PRIVATE_TOKEN = "MQACFPLSFF6ATDLQ3YJV";
const GOOGLE_API_KEY = "AIzaSyA42IF4OTsvdq0kaUiaCxxqLXqPgEECcng";

// Middleware
app.use(cors());
app.use(express.json());

// Test root route
app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

// ==================== EVENTS ROUTE ====================
app.get('/api/events', async (req, res) => {
  const { city, date } = req.query;

  if (!city || !date) {
    return res.status(400).json({ error: 'Missing city or date' });
  }

  try {
    const [ticketmasterEvents, eventbriteEvents] = await Promise.all([
      fetchTicketmasterEvents(city, date),
      fetchEventbriteEvents(city, date)
    ]);

    const allEvents = [...ticketmasterEvents, ...eventbriteEvents];
    res.json({ events: allEvents });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ==================== GOOGLE PLACES ROUTE ====================
app.get('/api/places', async (req, res) => {
  const { city, datetime } = req.query;
  if (!city || !datetime) return res.status(400).json({ error: 'Missing city or datetime' });

  try {
    // Step 1: Geocode city
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (!geoData.results.length) return res.status(404).json({ error: 'City not found' });

    const { lat, lng } = geoData.results[0].geometry.location;

    // Step 2: Search for places by type
    const types = ['park', 'restaurant', 'bar'];
    const places = [];

    for (const type of types) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&opennow=true&key=${GOOGLE_API_KEY}`;
      const placesRes = await fetch(placesUrl);
      const placesData = await placesRes.json();

      if (placesData.results?.length) {
        places.push(
          ...placesData.results.map(place => ({
            name: place.name,
            type,
            address: place.vicinity || '',
            rating: place.rating || null,
            photo: place.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : '',
          }))
        );
      }
    }

    res.json({ places });

  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// ==================== EVENTBRITE HELPER ====================
async function fetchEventbriteEvents(city, date) {
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(city)}&start_date.range_start=${date}T00:00:00Z&start_date.range_end=${date}T23:59:59Z`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` }
    });

    if (!response.ok) {
      console.error(`Eventbrite API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data.events) return [];

    return data.events.map(event => ({
      source: 'Eventbrite',
      name: event.name?.text || 'Unnamed Event',
      date: event.start?.local.split('T')[0] || 'Unknown Date',
      venue: event.venue_id || 'Unknown Venue',
      url: event.url,
      image: event.logo?.url || ''
    }));

  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return [];
  }
}

// ==================== TICKETMASTER HELPER ====================
async function fetchTicketmasterEvents(city, date) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=${encodeURIComponent(city)}&startDateTime=${date}T00:00:00Z&endDateTime=${date}T23:59:59Z`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Ticketmaster API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data._embedded || !data._embedded.events) return [];

    return data._embedded.events.map(event => ({
      source: 'Ticketmaster',
      name: event.name,
      date: event.dates.start.localDate,
      venue: event._embedded.venues[0]?.name || 'Unknown Venue',
      url: event.url,
      image: event.images[0]?.url || ''
    }));

  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    return [];
  }
}

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});