import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

// Your Supabase credentials
const SUPABASE_URL = 'https://qbnwppkarszzhuxsgnxw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibndwcGthcnN6emh1eHNnbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTM5NDAsImV4cCI6MjA2MjM4OTk0MH0.Y_5U0LDiiqRWvYdpsdMDBsX5CkEtsNeeIGdyfoxOIaM'; // truncated here

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Supabase-connected API is running');
});

// SIGN UP
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Account created!', user: data.user });
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Welcome back, ${email}`, user: data.user });
});

// LOGIN WITH FACEBOOK
app.post('/api/login-facebook', async (req, res) => {
  const { id, name, email } = req.body;
  const { data, error } = await supabase
    .from('users')
    .upsert([{ email, name, provider: 'facebook' }], { onConflict: ['email'] });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: `Logged in as ${name}` });
});

// SAVE FAVORITE
app.post('/api/favorites', async (req, res) => {
  const { userId, item, type } = req.body;
  if (!userId || !item || !type) return res.status(400).json({ error: 'Missing fields' });

  const { data, error } = await supabase
    .from('favorites')
    .insert([{ user_id: userId, type, data: item }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// LOAD FAVORITES
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

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
