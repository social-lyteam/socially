let favorites = [];
let favoritePlaces = [];
let latestEvents = [];

// Scroll buttons
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

function scrollToActivities() {
  const el = document.getElementById('activities-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Search Events + Places
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
      <div id="eats-section"><h2>Restaurants & Bars</h2></div>
      <div id="activities-section"><h2>Things to Do</h2></div>
    `;

    const parksSection = document.getElementById("parks-section");
    const eatsSection = document.getElementById("eats-section");
    const activitiesSection = document.getElementById("activities-section");

    const places = placesData.places;

    if (places.parks.length > 0) {
      places.parks.forEach(place => {
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" />
          <strong>${place.name}</strong><br/>
          ${place.type}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ""}<br/>
          <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
        `;
        parksSection.appendChild(el);
      });
    }

    if (places.restaurantsAndBars.length > 0) {
      places.restaurantsAndBars.forEach(place => {
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" />
          <strong>${place.name}</strong><br/>
          ${place.type}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ""}<br/>
          <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
        `;
        eatsSection.appendChild(el);
      });
    }

    if (places.activities.length > 0) {
      places.activities.forEach(place => {
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" />
          <strong>${place.name}</strong><br/>
          ${place.type}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ""}<br/>
          <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
        `;
        activitiesSection.appendChild(el);
      });
    }

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
  }
}

// Add event to favorites
function addToFavoritesFromIndex(index) {
  const event = latestEvents[index];
  if (event && !favorites.some(f => f.name === event.name)) {
    favorites.push(event);
    alert(`Added "${event.name}" to your favorites!`);
  }
}

// Add place to favorites
function addPlaceToFavorites(place) {
  if (!favoritePlaces.some(p => p.name === place.name)) {
    favoritePlaces.push(place);
    alert(`Added "${place.name}" to your favorites!`);
  }
}

// View all favorites
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
        ${place.type}<br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}
      `;
      resultsDiv.appendChild(el);
    });
  }
}

// Facebook login
function loginWithFacebook() {
  FB.login(function(response) {
    if (response.authResponse) {
      FB.api('/me', { fields: 'name,email,id' }, function(user) {
        document.getElementById('results').innerHTML = `
          <h2>Welcome, ${user.name}!</h2>
          <p>ID: ${user.id}</p>
          <p>Email: ${user.email || 'Not available'}</p>
        `;
      });
    }
  }, { scope: 'public_profile,email,user_friends' });
}
