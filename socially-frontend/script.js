let favorites = [];
let favoritePlaces = [];
let latestEvents = [];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToParks() {
  const el = document.getElementById('parks-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToEats() {
  const el = document.getElementById('eats-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

async function searchEvents() {
  const datetime = document.getElementById('datetime').value;
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const location = `${city}, ${state}`;

  if (!datetime || !city || !state) {
    alert('Please enter a date/time, city, and state.');
    return;
  }

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Searching...</h2>";

  try {
    const eventsRes = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${datetime.split('T')[0]}`);
    const eventsData = await eventsRes.json();

    const placesRes = await fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${encodeURIComponent(datetime)}`);
    const placesData = await placesRes.json();

    document.getElementById('skipButtons').style.display = 'block';

    resultsDiv.innerHTML = "<h2>Events:</h2>";
    if (eventsData.events && eventsData.events.length > 0) {
      latestEvents = eventsData.events;
      latestEvents.forEach((event, index) => {
        const el = document.createElement('div');
        el.className = 'event-card';
        el.innerHTML = `
          <img src="${event.image}" alt="${event.name}" />
          <strong>${event.name}</strong><br/>
          ${event.date}<br/>
          ${event.venue}<br/>
          <a href="${event.url}" target="_blank">View Event</a><br/>
          <small>Source: ${event.source}</small><br/>
          <button onclick="addToFavoritesFromIndex(${index})">❤️ Favorite</button>
        `;
        resultsDiv.appendChild(el);
      });
    } else {
      resultsDiv.innerHTML += "<p>No events found.</p>";
    }

    resultsDiv.innerHTML += `
      <div id="parks-section"><h2>Open Parks</h2></div>
      <div id="eats-section"><h2>Open Restaurants & Bars</h2></div>
    `;

    const parksSection = document.getElementById("parks-section");
    const eatsSection = document.getElementById("eats-section");

    if (placesData.places && placesData.places.length > 0) {
      placesData.places.forEach((place) => {
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" />
          <strong>${place.name}</strong><br/>
          ${place.type.charAt(0).toUpperCase() + place.type.slice(1)}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ""}<br/>
          <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
        `;
        (place.type === 'park' ? parksSection : eatsSection).appendChild(el);
      });
    } else {
      eatsSection.innerHTML += "<p>No nearby open places found.</p>";
    }

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
  }
}

function addToFavoritesFromIndex(index) {
  const event = latestEvents[index];
  if (event && !favorites.some(f => f.name === event.name)) {
    favorites.push(event);
    saveFavorite(event, 'event');
    alert(`Added "${event.name}" to your favorites!`);
  }
}

function addPlaceToFavorites(place) {
  if (!favoritePlaces.some(p => p.name === place.name)) {
    favoritePlaces.push(place);
    saveFavorite(place, 'place');
    alert(`Added "${place.name}" to your favorites!`);
  }
}

function viewFavorites() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Your Favorite Events:</h2>";

  if (favorites.length === 0) {
    resultsDiv.innerHTML += "<p>No favorite events yet.</p>";
  } else {
    favorites.forEach(event => {
      const el = document.createElement('div');
      el.className = 'event-card';
      el.innerHTML = `
        <img src="${event.image}" alt="${event.name}" />
        <strong>${event.name}</strong><br/>
        ${event.date}<br/>
        ${event.venue}<br/>
        <a href="${event.url}" target="_blank">View Event</a><br/>
        <small>Source: ${event.source}</small>
      `;
      resultsDiv.appendChild(el);
    });
  }

  resultsDiv.innerHTML += "<h2>Your Favorite Places:</h2>";

  if (favoritePlaces.length === 0) {
    resultsDiv.innerHTML += "<p>No favorite places yet.</p>";
  } else {
    favoritePlaces.forEach(place => {
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
        <img src="${place.photo}" alt="${place.name}" />
        <strong>${place.name}</strong><br/>
        ${place.type.charAt(0).toUpperCase() + place.type.slice(1)}<br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}
      `;
      resultsDiv.appendChild(el);
    });
  }
}

function saveFavorite(item, type) {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  fetch('https://socially-1-rm6w.onrender.com/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, item, type }),
  }).catch((err) => console.error("Save failed:", err));
}

async function loadUserFavorites() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    const res = await fetch(`https://socially-1-rm6w.onrender.com/api/favorites?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    favorites = data.events || [];
    favoritePlaces = data.places || [];
    console.log("✅ Loaded saved favorites");
  } catch (err) {
    console.error("❌ Failed to load favorites:", err);
  }
}

function renderMainLoginButton() {
  const container = document.getElementById('mainLoginButtonContainer');
  const user = localStorage.getItem('userId');

  if (container) {
    container.innerHTML = user
      ? `<button onclick="logout()" class="main-login-button">Logout</button>`
      : `<a href="login.html" class="main-login-button">Login or Sign Up</a>`;
  }
}

function logout() {
  localStorage.removeItem('userId');
  window.location.reload();
}

// Show/hide back to top button
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) {
    btn.style.display = window.scrollY > 300 ? 'block' : 'none';
  }
});

// INIT
renderMainLoginButton();
loadUserFavorites();
