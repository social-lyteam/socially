let favorites = [];
let favoritePlaces = [];
let latestEvents = [];
let latestPlaces = { parks: [], restaurants: [], bars: [], activities: [] };
let userCoords = null; // Stores current location

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToParks() {
  const el = document.getElementById('parks-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToRestaurants() {
  const el = document.getElementById('Restaurants-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToBars() {
  const el = document.getElementById('bars-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function scrollToActivities() {
  const el = document.getElementById('activities-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Toggle dropdown menu
function toggleDropdown() {
  const menu = document.getElementById('dropdownMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Toggle Add Friend section
function toggleAddFriend() {
  const section = document.getElementById('addFriendSection');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
  document.getElementById('dropdownMenu').style.display = 'none';
}

function toggleCreateEvent() {
  const section = document.getElementById('createEventSection');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
  document.getElementById('dropdownMenu').style.display = 'none';
}

async function submitEvent() {
  const email = localStorage.getItem('email');
  if (!email) {
    alert("You must be logged in to create an event.");
    return;
  }

  const name = document.getElementById('eventName').value;
  const venue = document.getElementById('eventVenue').value;
  const city = document.getElementById('eventCity').value;
  const state = document.getElementById('eventState').value;
  const date = document.getElementById('eventDate').value;
  const url = document.getElementById('eventUrl').value;
  const imageInput = document.getElementById('eventImage');
  const imageFile = imageInput.files[0];

  if (!name || !city || !state || !date || !imageFile) {
    alert("Please fill in all required fields.");
    return;
  }

  const formData = new FormData();
  formData.append('email', email);
  formData.append('name', name);
  formData.append('venue', venue);
  formData.append('city', city);
  formData.append('state', state);
  formData.append('date', date);
  formData.append('url', url);
  formData.append('image', imageFile);

  try {
    const res = await fetch('https://socially-1-rm6w.onrender.com/api/custom-events', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    document.getElementById('eventStatus').textContent = data.success ? "✅ Event created!" : `❌ ${data.error}`;
  } catch (err) {
    console.error("Error submitting event:", err);
    document.getElementById('eventStatus').textContent = "❌ Submission failed.";
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  document.getElementById('dropdownMenu').style.display = 'none';
}

function renderAuthButton() {
  const authButton = document.getElementById('authButton');
  const email = localStorage.getItem('email');
  if (authButton) {
    authButton.textContent = email ? 'Logout' : 'Login/Signup';
  }
}

function handleAuthClick() {
  const email = localStorage.getItem('email');
  if (email) {
    localStorage.removeItem('email');
    location.reload();
  } else {
    window.location.href = 'login.html';
  }
}

 async function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      userCoords = { lat, lng }; // Save for distance sorting

      try {
        const res = await fetch(`https://socially-1-rm6w.onrender.com/api/reverse-geocode?lat=${lat}&lng=${lng}`);
        const data = await res.json();

        if (data.city && data.state) {
          document.getElementById("city").value = data.city;
          document.getElementById("state").value = data.state;
        } else {
          alert("Could not determine your location.");
        }
      } catch (err) {
        alert("Error fetching location details.");
        console.error(err);
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert("Location access denied. Please enable it in your browser settings.");
      } else {
        alert("Unable to retrieve your location.");
      }
    }
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function sortPlaces(array, criterion) {
  if (criterion === 'alphabetical') {
    return array.sort((a, b) => a.name.localeCompare(b.name));
  } else if (criterion === 'rating') {
    return array.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (criterion === 'distance' && userCoords) {
    return array.sort((a, b) => {
      const distA = getDistance(userCoords, a);
      const distB = getDistance(userCoords, b);
      return distA - distB;
    });
  }
  return array; // default: no sort
}

function getDistance(user, place) {
  if (!place.lat || !place.lng) return Infinity;
  const dx = user.lat - place.lat;
  const dy = user.lng - place.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

async function searchEvents() {
  const datetimeInput = document.getElementById('datetime').value;
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const location = `${city}, ${state}`;
  const sortOption = document.getElementById('sortOption')?.value || 'default';

  if (!datetimeInput || !city || !state) {
    alert('Please enter a date/time, city, and state/province/country.');
    return;
  }

  const date = datetimeInput;

  const resultsDiv = document.getElementById('results');
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  resultsDiv.innerHTML = ""; // Clear old content

  try {
    const eventsRes = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${date}`);
    const eventsData = await eventsRes.json();

    const placesRes = await fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${encodeURIComponent(date)}`);
    const placesData = await placesRes.json();
    latestPlaces = placesData.places;

    document.getElementById('skipButtons').style.display = 'block';

    document.getElementById('sortWrapper').style.display = 'block';

    // Render Events
    resultsDiv.innerHTML = "<h2>Events:</h2>";
    if (eventsData.events && eventsData.events.length > 0) {
      latestEvents = eventsData.events;  // ✅ This is required
      eventsData.events.forEach((event, index) => {
        const el = document.createElement('div');
        el.className = 'event-card' + (event.source === 'User' ? ' user-event' : '');
        el.innerHTML = `
          <img src="${event.image}" alt="${event.name}" />
          <strong>${event.name}</strong><br/>
          ${event.date}<br/>
          ${event.venue}<br/>
          <a href="${event.url}" target="_blank">View Event</a><br/>
          <small>Source: ${event.source}</small><br/>
          <button onclick="addToFavoritesFromIndex(${index})">❤️ Favorite</button>
        `;

        if (event.source === 'User') {
         el.innerHTML += `
        <button onclick="reportEvent('${event.name}', '${event.date}', '${event.venue}')">🚩 Report</button>
      `;
    }

        resultsDiv.appendChild(el);
      });
    } else {
      resultsDiv.innerHTML += "<p>No events found.</p>";
    }

    // Render Places
    const { parks, restaurants, bars, activities } = placesData.places;

    const sortedParks = sortPlaces(parks, sortOption);
    const sortedRestaurants = sortPlaces(restaurants, sortOption);
    const sortedBars = sortPlaces(bars, sortOption);
    const sortedActivities = sortPlaces(activities, sortOption);

    // Restaurants Section
    resultsDiv.innerHTML += `<div id="restaurants-section"><h2>Restaurants</h2></div>`;
    sortedRestaurants.forEach(place => {
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
      const distanceText = (userCoords && sortOption === 'distance' && place.lat && place.lng)
        ? `<br/><small>📍 ${calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng).toFixed(1)} km away</small>`
        : '';
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
       <img src="${place.photo}" alt="${place.name}" />
       <strong>${place.name}</strong><br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}${distanceText}<br/>
       <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
       <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
     `;
      document.getElementById('restaurants-section').appendChild(el);
    });

    // Bars Section
    resultsDiv.innerHTML += `<div id="bars-section"><h2>Bars</h2></div>`;
    sortedBars.forEach(place => {
     const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
     const distanceText = (userCoords && sortOption === 'distance' && place.lat && place.lng)
       ? `<br/><small>📍 ${calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng).toFixed(1)} km away</small>`
       : '';
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
        <img src="${place.photo}" alt="${place.name}" />
        <strong>${place.name}</strong><br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}${distanceText}<br/>
        <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
        <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
      `;
      document.getElementById('bars-section').appendChild(el);
    });

    resultsDiv.innerHTML += `<div id="activities-section"><h2>Things to Do</h2></div>`;
    sortedActivities.forEach(place => {
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
      const distanceText = (userCoords && sortOption === 'distance' && place.lat && place.lng)
        ? `<br/><small>📍 ${calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng).toFixed(1)} km away</small>`
        : '';
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
        <img src="${place.photo}" alt="${place.name}" />
        <strong>${place.name}</strong><br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}${distanceText}<br/>
        <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
        <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
      `;

      const activitiesEl = document.getElementById('activities-section');
      if (activitiesEl) activitiesEl.appendChild(el);
    });

    resultsDiv.innerHTML += `<div id="parks-section"><h2>Parks</h2></div>`;
    sortedParks.forEach(place => {
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
      const distanceText = (userCoords && sortOption === 'distance' && place.lat && place.lng)
        ? `<br/><small>📍 ${calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng).toFixed(1)} km away</small>`
        : '';
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
        <img src="${place.photo}" alt="${place.name}" />
        <strong>${place.name}</strong><br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}${distanceText}<br/>
        <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
        <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
      `;

      const parksEl = document.getElementById('parks-section');
      if (parksEl) parksEl.appendChild(el);
    });

    if (loadingSpinner) loadingSpinner.style.display = 'none';

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function addToFavoritesFromIndex(index) {
  const event = latestEvents[index];
  const email = localStorage.getItem('email');
  if (!event || !email) {
    alert("Please log in to save favorites.");
    return;
  }

  fetch('https://socially-1-rm6w.onrender.com/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, item: event, type: 'event' })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      favorites.push(event);
      const card = document.querySelectorAll('.event-card')[index];
      if (data.alsoFavoritedBy?.length > 0) {
        const matchDiv = document.createElement('div');
        matchDiv.innerHTML = `<small>Also favorited by: ${data.alsoFavoritedBy.join(', ')}</small>`;
        card.appendChild(matchDiv);
      }
      alert(`Added "${event.name}" to your favorites!`);
    } else {
      alert('Failed to save favorite.');
    }
  })
  .catch(err => console.error("Favorite event error:", err));
}

function addPlaceToFavorites(place) {
  const email = localStorage.getItem('email');
  if (!place || !email) {
    alert("Please log in to save favorites.");
    return;
  }

  fetch('https://socially-1-rm6w.onrender.com/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, item: place, type: 'place' })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      favoritePlaces.push(place);
      alert(`Added "${place.name}" to your favorites!`);

      const allPlaceCards = document.querySelectorAll('.place-card');
      for (const card of allPlaceCards) {
        const strong = card.querySelector('strong');
        if (strong && strong.textContent === place.name && data.alsoFavoritedBy?.length > 0) {
          const matchDiv = document.createElement('div');
          matchDiv.innerHTML = `<small>Also favorited by: ${data.alsoFavoritedBy.join(', ')}</small>`;
          card.appendChild(matchDiv);
          break;
        }
      }
    } else {
      alert('Failed to save favorite.');
    }
  })
  .catch(err => console.error("Favorite place error:", err));
}

function addPlaceCard(place, section) {
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
  section.appendChild(el);
}

function reportEvent(name, date, venue) {
  const email = localStorage.getItem('email'); // Optional

  fetch('https://socially-1-rm6w.onrender.com/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: name,
      eventDate: date,
      eventVenue: venue,
      reporterEmail: email || null
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('✅ Event reported. Thank you for your feedback.');
    } else {
      alert('❌ Failed to report event. Try again later.');
    }
  })
  .catch(err => {
    console.error('Report error:', err);
    alert('❌ Network error while reporting.');
  });
}

function removeFavorite(name, type) {
  const email = localStorage.getItem('email');
  if (!email) return;

  fetch('https://socially-1-rm6w.onrender.com/api/favorites', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, itemName: name, type })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (type === 'event') {
          favorites = favorites.filter(f => f.name !== name);
        } else if (type === 'place') {
          favoritePlaces = favoritePlaces.filter(p => p.name !== name);
        }
        viewFavorites();
      } else {
        alert('Failed to remove favorite.');
      }
    })
    .catch(err => console.error("Error removing favorite:", err));
}

function viewFavorites() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Your Favorite Events:</h2>";

  const email = localStorage.getItem('email');
  if (!email) return;

  if (favorites.length === 0) {
    resultsDiv.innerHTML += "<p>No favorite events yet.</p>";
  } else {
    favorites.forEach(async (event) => {
      const el = document.createElement('div');
      el.className = 'event-card';
      el.innerHTML = `
        <img src="${event.image}" alt="${event.name}" />
        <strong>${event.name}</strong><br/>
        ${event.date}<br/>
        ${event.venue}<br/>
        <a href="${event.url}" target="_blank">View Event</a><br/>
        <small>Source: ${event.source}</small><br/>
        <button onclick="removeFavorite('${event.name}', 'event')">❌ Remove</button>
        <div class="also-favorited"></div>
      `;
      resultsDiv.appendChild(el);

      const alsoDiv = el.querySelector('.also-favorited');
      const res = await fetch('https://socially-1-rm6w.onrender.com/api/favorites/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemName: event.name, type: 'event' })
      });
      const data = await res.json();
      if (data.alsoFavoritedBy?.length > 0) {
        alsoDiv.innerHTML = `<em>Also favorited by: ${data.alsoFavoritedBy.join(', ')}</em>`;
      }
    });
  }

  resultsDiv.innerHTML += "<h2>Your Favorite Places:</h2>";

  if (favoritePlaces.length === 0) {
    resultsDiv.innerHTML += "<p>No favorite places yet.</p>";
  } else {
    favoritePlaces.forEach(async (place) => {
      const el = document.createElement('div');
      el.className = 'place-card';
      el.innerHTML = `
        <img src="${place.photo}" alt="${place.name}" />
        <strong>${place.name}</strong><br/>
        ${place.type}<br/>
        ${place.address}<br/>
        ${place.rating ? `⭐ ${place.rating}` : ""}<br/>
        <button onclick="removeFavorite('${place.name}', 'place')">❌ Remove</button>
        <div class="also-favorited"></div>
      `;
      resultsDiv.appendChild(el);

      const alsoDiv = el.querySelector('.also-favorited');
      const res = await fetch('https://socially-1-rm6w.onrender.com/api/favorites/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, itemName: place.name, type: 'place' })
      });
      const data = await res.json();
      if (data.alsoFavoritedBy?.length > 0) {
        alsoDiv.innerHTML = `<em>Also favorited by: ${data.alsoFavoritedBy.join(', ')}</em>`;
      }
    });
  }
}

function addFriend() {
  const user_email = localStorage.getItem('email');
  const friend_email = document.getElementById('friendEmailInput').value.trim();
  const statusEl = document.getElementById('friendStatus');

  if (!user_email || !friend_email) {
    statusEl.textContent = "❌ You must be logged in and enter a friend's email.";
    statusEl.style.color = 'red';
    return;
  }

  fetch('https://socially-1-rm6w.onrender.com/api/friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_email, friend_email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      statusEl.textContent = "✅ Friend added!";
      statusEl.style.color = 'green';
      setTimeout(() => location.reload(), 1000);
    } else {
      statusEl.textContent = `❌ ${data.error}`;
      statusEl.style.color = 'red';
    }
  })
  .catch(err => {
    console.error("Add friend error:", err);
    statusEl.textContent = "❌ Network error. Try again later.";
    statusEl.style.color = 'red';
  });
}

async function loadFriends() {
  const email = localStorage.getItem('email');
  if (!email) return;

  try {
    const res = await fetch(`https://socially-1-rm6w.onrender.com/api/friends?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';
    data.friends.forEach(friend => {
      const li = document.createElement('li');
      li.textContent = friend;
      friendList.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading friends:", err);
  }
}

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

function renderAuthButton() {
  const authButton = document.getElementById('authButton');
  const email = localStorage.getItem('email');
  if (authButton) {
    authButton.textContent = email ? 'Logout' : 'Login/signup';
  }
}

function handleAuthClick() {
  const email = localStorage.getItem('email');
  if (email) {
    localStorage.removeItem('email');
    location.reload();
  } else {
    window.location.href = 'login.html';
  }
}

async function loadFavorites() {
  const email = localStorage.getItem('email');
  if (!email) return;

  try {
    const res = await fetch(`https://socially-1-rm6w.onrender.com/api/favorites?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    favorites = data.events || [];
    favoritePlaces = data.places || [];
  } catch (err) {
    console.error("Error loading favorites:", err);
  }
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.style.display = window.scrollY > 700 ? 'block' : 'none';
});

document.addEventListener('DOMContentLoaded', () => {
  renderAuthButton();
  loadFavorites();
  loadFriends();

  // Restore dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  document.getElementById('sortOption')?.addEventListener('change', () => {
  const resultsExist = document.getElementById('results')?.children.length > 0;
  if (resultsExist) searchEvents(); // refresh results with new sort
});

  if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    position => {
      userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    },
    err => console.warn("Geolocation permission denied or failed.", err)
  );
}
  async function loadFeaturedEvents() {
  const container = document.getElementById('featuredEventContainer');
  if (!container) return;

  const cities = ['New York, NY', 'London, UK', 'Sydney, AU', 'Berlin, DE', 'Toronto, CA', 'Barcelona, ES', 'Los Angeles, CA'];
  const shownCities = [];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];

  async function showNextEvent() {
    let city;

    // Choose a new city not in the last 5 shown
    const availableCities = cities.filter(c => !shownCities.includes(c));
    if (availableCities.length === 0) {
      shownCities.length = 0; // Reset if all cities have been used recently
      city = cities[Math.floor(Math.random() * cities.length)];
    } else {
      city = availableCities[Math.floor(Math.random() * availableCities.length)];
    }

    shownCities.push(city);
    if (shownCities.length > 5) shownCities.shift(); // Keep only last 5

    try {
      const res = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(city)}&date=${date}`);
      const data = await res.json();

      if (data.events && data.events.length > 0) {
        const randomEvent = data.events[Math.floor(Math.random() * data.events.length)];
        container.innerHTML = `
          <img src="${randomEvent.image}" alt="${randomEvent.name}" />
          <strong>${randomEvent.name}</strong><br/>
          ${randomEvent.date}<br/>
          ${randomEvent.venue}<br/>
          <a href="${randomEvent.url}" target="_blank">View Event</a><br/>
          <small>${randomEvent.source} – ${city}</small>
        `;
      } else {
        console.log(`Skipping ${city}, no events found.`);
        await showNextEvent(); // Automatically try the next city
      }
    } catch (err) {
      console.error("Error loading featured event:", err);
      container.innerHTML = "Failed to load featured events.";
    }
  }

  // First call immediately
  await showNextEvent();

  // Then every 7 seconds
  setInterval(showNextEvent, 7000);
}

loadFeaturedEvents();

window.onclick = function(event) {
  if (!event.target.matches('.dropdown button')) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].style.display = "none";
    }
  }
}});

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateDateNight() {
  const includeEvents = document.getElementById('includeEvents')?.checked;
  const includeRestaurants = document.getElementById('includeRestaurants')?.checked;
  const includeBars = document.getElementById('includeBars')?.checked;
  const includeActivities = document.getElementById('includeActivities')?.checked;
  const includeParks = document.getElementById('includeParks')?.checked;

  const city = document.getElementById('city')?.value.trim();
  const state = document.getElementById('state')?.value.trim();
  const date = document.getElementById('datetime')?.value;

  if (!city || !state || !date) {
    alert("Please fill in the date, city, and state.");
    return;
  }

  if (!includeEvents && !includeRestaurants && !includeBars && !includeActivities && !includeParks) {
    alert("Please select at least one category.");
    return;
  }

  const location = `${city}, ${state}`;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<h2>Your Date Night Plan:</h2>';
  resultsDiv.innerHTML = `
    <div id="dateNightLoader" style="text-align:center;">
      <div class="spinner"><div class="loader"></div></div>
      <p style="font-size:1.2em;">Searching for results...</p>
    </div>
  `;

  try {
    let eventData = [], placesData = {};
    if (includeEvents) {
      const eventsRes = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${date}`);
      const eventsJson = await eventsRes.json();
      latestEvents = eventsJson.events || [];
      eventData = latestEvents;
    }

    if (includeRestaurants || includeBars || includeActivities || includeParks) {
      const placesRes = await fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${date}`);
      const placesJson = await placesRes.json();
      latestPlaces = placesJson.places || {};
    }

    const selected = [];

    if (includeEvents && eventData.length > 0)
      selected.push({ type: 'Event', item: getRandomItem(eventData) });

    if (includeRestaurants && latestPlaces.restaurants.length > 0)
      selected.push({ type: 'Restaurant', item: getRandomItem(latestPlaces.restaurants) });

    if (includeBars && latestPlaces.bars?.length > 0)
      selected.push({ type: 'Bar', item: getRandomItem(latestPlaces.bars) });

    if (includeActivities && latestPlaces.activities?.length > 0)
      selected.push({ type: 'Activity', item: getRandomItem(latestPlaces.activities) });

    if (includeParks && latestPlaces.parks?.length > 0)
      selected.push({ type: 'Park', item: getRandomItem(latestPlaces.parks) });

    if (selected.length === 0) {
      resultsDiv.innerHTML = '<h2>Your Date Night Plan:</h2><p>No results found for selected categories.</p>';
      return;
    }

    // Render cards
    resultsDiv.innerHTML = '<h2>Your Date Night Plan:</h2>';

    selected.forEach(({ type, item }) => {
      const label = document.createElement('h3');
      label.textContent = type;
      resultsDiv.appendChild(label);

      if (type === 'Event') {
        renderEventCard(item, resultsDiv);
      } else {
        renderPlaceCard(item, resultsDiv);
      }
    });

  } catch (err) {
    console.error("Date Night Generator error:", err);
    resultsDiv.innerHTML = "<p>Something went wrong. Please try again later.</p>";
  }
}

function renderEventCard(event, parentEl) {
  const el = document.createElement('div');
  el.className = 'event-card' + (event.source === 'User' ? ' user-event' : '');
  el.innerHTML = `
    <img src="${event.image}" alt="${event.name}" />
    <strong>${event.name}</strong><br/>
    ${event.date}<br/>
    ${event.venue}<br/>
    <a href="${event.url}" target="_blank">View Event</a><br/>
    <small>Source: ${event.source}</small><br/>
    <button onclick="addToFavoritesFromIndex(${latestEvents.indexOf(event)})">❤️ Favorite</button>
  `;

  if (event.source === 'User') {
    el.innerHTML += `
      <button onclick="reportEvent('${event.name}', '${event.date}', '${event.venue}')">🚩 Report</button>
    `;
  }

  parentEl.appendChild(el);
}

function renderPlaceCard(place, parentEl) {
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
  const distanceText = (userCoords && place.lat && place.lng)
    ? `<br/><small>📍 ${calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng).toFixed(1)} km away</small>`
    : '';

  const el = document.createElement('div');
  el.className = 'place-card';
  el.innerHTML = `
    <img src="${place.photo}" alt="${place.name}" />
    <strong>${place.name}</strong><br/>
    ${place.address}<br/>
    ${place.rating ? `⭐ ${place.rating}` : ""}${distanceText}<br/>
    <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
    <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
  `;

  parentEl.appendChild(el);

  // 👉 Scroll to results
document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });

}