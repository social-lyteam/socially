import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// API keys
const TICKETMASTER_API_KEY = 'mPLzpIXal7XLK2mMxFTQgaPOEQMiGRAY';
const EVENTBRITE_PRIVATE_TOKEN = 'MQACFPLSFF6ATDLQ3YJV';
const GOOGLE_API_KEY = 'AIzaSyA42IF4OTsvdq0kaUiaCxxqLXqPgEECcng';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ API running');
});

// ======== EVENTS ROUTE ========
app.get('/api/events', async (req, res) => {
  const { city, date } = req.query;
  if (!city || !date) return res.status(400).json({ error: 'Missing city or date' });

  try {
    const [tm, eb] = await Promise.all([
      fetchTicketmasterEvents(city, date),
      fetchEventbriteEvents(city, date),
    ]);
    res.json({ events: [...tm, ...eb] });
  } catch (e) {
    console.error('Event fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ======== PLACES ROUTE (FILTERED) ========
app.get('/api/places', async (req, res) => {
  const { city, datetime } = req.query;
  if (!city || !datetime) return res.status(400).json({ error: 'Missing city or datetime' });

  try {
    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_API_KEY}`);
    const geoData = await geoRes.json();
    if (!geoData.results.length) return res.status(404).json({ error: 'City not found' });

    const { lat, lng } = geoData.results[0].geometry.location;
    const types = ['park', 'restaurant', 'bar'];
    const places = [];
    const excludedTypes = ['gas_station', 'meal_takeaway', 'convenience_store', 'fast_food'];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&opennow=true&key=${GOOGLE_API_KEY}`;
      const resPlaces = await fetch(url);
      const data = await resPlaces.json();

      if (data.results?.length) {
        const filtered = data.results
          .filter(p => !excludedTypes.some(ex => p.types?.includes(ex)))
          .map(p => ({
            name: p.name,
            type,
            address: p.vicinity || '',
            rating: p.rating || null,
            photo: p.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
              : '',
          }));
        places.push(...filtered);
      }
    }

    res.json({ places });
  } catch (e) {
    console.error('Place fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// ======== EVENTBRITE ========
async function fetchEventbriteEvents(city, date) {
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(city)}&start_date.range_start=${date}T00:00:00Z&start_date.range_end=${date}T23:59:59Z`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.events || []).map(event => ({
      source: 'Eventbrite',
      name: event.name?.text,
      date: event.start?.local.split('T')[0],
      venue: event.venue_id || 'Unknown Venue',
      url: event.url,
      image: event.logo?.url || '',
    }));
  } catch {
    return [];
  }
}

// ======== TICKETMASTER ========
async function fetchTicketmasterEvents(city, date) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=${encodeURIComponent(city)}&startDateTime=${date}T00:00:00Z&endDateTime=${date}T23:59:59Z`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data._embedded?.events || []).map(event => ({
      source: 'Ticketmaster',
      name: event.name,
      date: event.dates.start.localDate,
      venue: event._embedded.venues[0]?.name,
      url: event.url,
      image: event.images[0]?.url || '',
    }));
  } catch {
    return [];
  }
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
