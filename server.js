import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// YOUR REAL API KEYS
const TICKETMASTER_API_KEY = "mPLzpIXal7XLK2mMxFTQgaPOEQMiGRAY";
const EVENTBRITE_PRIVATE_TOKEN = "MQACFPLSFF6ATDLQ3YJV";

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to search events
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

    // Merge all events
    const allEvents = [...ticketmasterEvents, ...eventbriteEvents];

    res.json({ events: allEvents });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Functions to fetch events

async function fetchTicketmasterEvents(city, date) {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=${encodeURIComponent(city)}&startDateTime=${date}T00:00:00Z&endDateTime=${date}T23:59:59Z`;
  const response = await fetch(url);
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
}

async function fetchEventbriteEvents(city, date) {
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.address=${encodeURIComponent(city)}&start_date.range_start=${date}T00:00:00Z&start_date.range_end=${date}T23:59:59Z`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${EVENTBRITE_PRIVATE_TOKEN}`
    }
  });
  const data = await response.json();

  if (!data.events) return [];

  return data.events.map(event => ({
    source: 'Eventbrite',
    name: event.name.text,
    date: event.start.local.split('T')[0],
    venue: event.venue_id || 'Eventbrite Venue',
    url: event.url,
    image: event.logo?.url || ''
  }));
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
