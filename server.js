import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase
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
  res.json({ user: data.user });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user });
});

app.post('/api/login-facebook', async (req, res) => {
  const { id, name, email } = req.body;
  const { error } = await supabase
    .from('users')
    .upsert([{ email, name, provider: 'facebook' }], { onConflict: ['email'] });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Logged in as ${name}` });
});

// Save favorite by email
app.post('/api/favorites', async (req, res) => {
    const { email, item, type } = req.body;
    if (!email || !item || !type) return res.status(400).json({ error: 'Missing fields' });
  
    const { error } = await supabase
      .from('favorites')
      .insert([{ email, type, data: item }]);
  
    if (error) return res.status(400).json({ error: error.message });
  
    res.json({ success: true });
  });
  
  // Load favorites by email
  app.get('/api/favorites', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Missing email' });
  
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('email', email);
  
    if (error) return res.status(400).json({ error: error.message });
  
    const events = data.filter(f => f.type === 'event').map(f => f.data);
    const places = data.filter(f => f.type === 'place').map(f => f.data);
    res.json({ events, places });
  });  

// Remove favorite by email
app.delete('/api/favorites', async (req, res) => {
  const { email, item, type } = req.body;
  if (!email || !item || !type) {
    return res.status(400).json({ error: 'Missing email, item, or type' });
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('email', email)
    .eq('type', type)
    .contains('data', { name: item.name });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true });
});

// Events (Ticketmaster)
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

// Places (Google Places)
app.get('/api/places', async (req, res) => {
  const { city, datetime } = req.query;
  if (!city || !datetime) return res.status(400).json({ error: 'Missing city or datetime' });

  try {
    const restaurantBarTypes = ['restaurant', 'bar'];
    const activityKeywords = [
      'escape room', 'rage room', 'axe throwing', 'topgolf', 'arcade',
      'bowling alley', 'comedy club', 'indoor golf', 'mini golf',
      'laser tag', 'paintball', 'trampoline park', 'climbing gym'
    ];

    const allPlaces = {
      restaurantsAndBars: [],
      activities: [],
      parks: []
    };

    // Parks
    const parkUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=park+in+${encodeURIComponent(city)}&key=${GOOGLE_PLACES_API_KEY}`;
    const parkRes = await fetch(parkUrl);
    const parkData = await parkRes.json();
    parkData.results?.forEach(p => {
      if (!p.name.toLowerCase().includes('gas station') && !p.name.toLowerCase().includes('fast food')) {
        allPlaces.parks.push({
          name: p.name,
          type: 'park',
          address: p.formatted_address,
          rating: p.rating,
          photo: p.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : 'https://placehold.co/300x200?text=No+Image'
        });
      }
    });

    // Restaurants & Bars
    for (const type of restaurantBarTypes) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${type}+in+${encodeURIComponent(city)}&key=${GOOGLE_PLACES_API_KEY}`;
      const resPlaces = await fetch(url);
      const data = await resPlaces.json();
      data.results?.forEach(p => {
        if (!p.name.toLowerCase().includes('gas station') && !p.name.toLowerCase().includes('fast food')) {
          allPlaces.restaurantsAndBars.push({
            name: p.name,
            type,
            address: p.formatted_address,
            rating: p.rating,
            photo: p.photos?.[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : 'https://placehold.co/300x200?text=No+Image'
          });
        }
      });
    }

    // Activities
    for (const keyword of activityKeywords) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}+in+${encodeURIComponent(city)}&key=${GOOGLE_PLACES_API_KEY}`;
      const resPlaces = await fetch(url);
      const data = await resPlaces.json();
      data.results?.forEach(p => {
        allPlaces.activities.push({
          name: p.name,
          type: keyword,
          address: p.formatted_address,
          rating: p.rating,
          photo: p.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : 'https://placehold.co/300x200?text=No+Image'
        });
      });
    }

    res.json({ places: allPlaces });
  } catch (err) {
    console.error('Error fetching places:', err);
    res.status(500).json({ error: 'Error fetching places' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
