import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

// Supabase credentials
const SUPABASE_URL = 'https://qbnwppkarszzhuxsgnxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibndwcGthcnN6emh1eHNnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTM5NDAsImV4cCI6MjA2MjM4OTk0MH0.Y_5U0LDiiqRWvYdpsdMDBsX5CkEtsNeeIGdyfoxOIaM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// External APIs
const TICKETMASTER_API_KEY = 'mPLzpIXal7XLK2mMxFTQgaPOEQMiGRAY';
const GOOGLE_PLACES_API_KEY = 'AIzaSyA42IF4OTsvdq0kaUiaCxxqLXqPgEECcng';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Supabase-connected API is running');
});

// Auth routes
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Account created!', user: data.user });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Welcome back, ${email}`, user: data.user });
});

app.post('/api/login-facebook', async (req, res) => {
  const { id, name, email } = req.body;
  const { data, error } = await supabase
    .from('users')
    .upsert([{ email, name, provider: 'facebook' }], { onConflict: ['email'] });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Logged in as ${name}` });
});

// Favorites
app.post('/api/favorites', async (req, res) => {
  const { userId, item, type } = req.body;
  if (!userId || !item || !type) return res.status(400).json({ error: 'Missing fields' });
  const { error } = await supabase
    .from('favorites')
    .insert([{ user_id: userId, type, data: item }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.get('/api/favorites', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);
  if (error) return res.status(400).json({ error: error.message });
  const events = data.filter(f => f.type === 'event').map(f => f.data);
  const places = data.filter(f => f.type === 'place').map(f => f.data);
  res.json({ events, places });
});

// Events route (Ticketmaster)
app.get('/api/events', async (req, res) => {
  const { city, date } = req.query;
  if (!city || !date) return res.status(400).json({ error: 'Missing city or date' });

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=${encodeURIComponent(city)}&startDateTime=${date}T00:00:00Z&endDateTime=${date}T23:59:59Z`;
    const tmRes = await fetch(url);
    const tmData = await tmRes.json();

    const events = (tmData._embedded?.events || []).map(event => ({
      name: event.name,
      date: event.dates?.start?.localDate || '',
      venue: event._embedded?.venues?.[0]?.name || '',
      url: event.url,
      image: event.images?.[0]?.url || '',
      source: 'Ticketmaster'
    }));

    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Places route (Google Places)
app.get('/api/places', async (req, res) => {
  const { city, datetime } = req.query;
  if (!city || !datetime) return res.status(400).json({ error: 'Missing city or datetime' });

  try {
    const types = ['park', 'restaurant', 'bar'];
    const places = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${type}+in+${encodeURIComponent(city)}&key=${GOOGLE_PLACES_API_KEY}`;
      const placeRes = await fetch(url);
      const placeData = await placeRes.json();

      (placeData.results || []).forEach(place => {
        if (
          place.name.toLowerCase().includes('gas station') ||
          place.name.toLowerCase().includes('fast food')
        ) return;

        places.push({
          name: place.name,
          type: type,
          address: place.formatted_address,
          rating: place.rating,
          photo: place.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : 'https://via.placeholder.com/300x200?text=No+Image'
        });
      });
    }

    res.json({ places });
  } catch (err) {
    console.error('Error fetching places:', err);
    res.status(500).json({ error: 'Error fetching places' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
