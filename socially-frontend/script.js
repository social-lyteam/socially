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

function scrollToActivities() {
  const el = document.getElementById('activities-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

async function fetchPopularityCounts(type) {
  const res = await fetch('https://socially-1-rm6w.onrender.com/api/favorites/count', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  return await res.json();
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

async function searchEvents() {
  const datetimeInput = document.getElementById('datetime').value;
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const sortOption = document.getElementById('sortOption')?.value || 'alphabetical';
  const location = `${city}, ${state}`;

  if (!datetimeInput || !city || !state) {
    alert('Please enter a date/time, city, and state/province/country.');
    return;
  }

  const date = datetimeInput;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Searching...</h2>";

  try {
    // Fetch data + popularity counts in parallel
    const [eventsRes, placesRes, eventCounts, placeCounts] = await Promise.all([
      fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${date}`),
      fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${encodeURIComponent(date)}`),
      fetchPopularityCounts('event'),
      fetchPopularityCounts('place')
    ]);

    const eventsData = await eventsRes.json();
    const placesData = await placesRes.json();

    // Map name -> count
    const eventFavMap = Object.fromEntries(eventCounts.map(e => [e.name, e.count]));
    const placeFavMap = Object.fromEntries(placeCounts.map(p => [p.name, p.count]));

    // Inject favCount into data
    eventsData.events.forEach(e => e.favCount = eventFavMap[e.name] || 0);
    latestEvents = eventsData.events;
    const { parks, restaurantsAndBars, activities } = placesData.places;
    parks.forEach(p => p.favCount = placeFavMap[p.name] || 0);
    restaurantsAndBars.forEach(p => p.favCount = placeFavMap[p.name] || 0);
    activities.forEach(p => p.favCount = placeFavMap[p.name] || 0);

    const sortBy = (array) => {
      if (sortOption === 'alphabetical') {
        return array.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'highestRated') {
        return array.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortOption === 'mostPopular') {
        return array.sort((a, b) => (b.favCount || 0) - (a.favCount || 0));
      }
      return array;
    };

    document.getElementById('skipButtons').style.display = 'block';

    // Render Events
    resultsDiv.innerHTML = "<h2>Events:</h2>";
    sortBy(eventsData.events).forEach((event, index) => {
      const el = document.createElement('div');
      el.className = 'event-card';
      el.innerHTML = `
        <img src="${event.image}" alt="${event.name}" />
        <strong>${event.name}</strong><br/>
        ${event.date}<br/>
        ${event.venue}<br/>
        <a href="${event.url}" target="_blank">View Event</a><br/>
        <small>❤️ ${event.favCount} favorites | Source: ${event.source}</small><br/>
        <button onclick='addEventToFavorites(${JSON.stringify(event).replace(/'/g, "\\'")})'>❤️ Favorite</button>
      `;
      resultsDiv.appendChild(el);
    });

    // Render Places
    const placeSections = [
      { title: 'Parks', data: sortBy(parks), id: 'parks-section' },
      { title: 'Restaurants & Bars', data: sortBy(restaurantsAndBars), id: 'eats-section' },
      { title: 'Things to Do', data: sortBy(activities), id: 'activities-section' }
    ];

    placeSections.forEach(section => {
      resultsDiv.innerHTML += `<div id="${section.id}"><h2>${section.title}</h2></div>`;
      section.data.forEach(place => {
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" />
          <strong>${place.name}</strong><br/>
          ${place.type || ''}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ''}<br/>
          <small>❤️ ${place.favCount} favorites</small><br/>
          <a href="${mapsLink}" target="_blank">View on Google Maps</a><br/>
          <button onclick='addPlaceToFavorites(${JSON.stringify(place).replace(/'/g, "\\'")})'>❤️ Favorite</button>
        `;
        document.getElementById(section.id).appendChild(el);
      });
    });

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
  }
}

function addEventToFavorites(event) {
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

function applySorting() {
  const sortBy = document.getElementById('sort').value;

  const sortFunction = (a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === 'popular') {
      return (b.favCount || 0) - (a.favCount || 0);
    }
    return 0;
  };

  // Apply to in-memory lists and re-render
  if (window.allPlaces) {
    for (const category in window.allPlaces) {
      window.allPlaces[category].sort(sortFunction);
    }
  }
  if (window.latestEvents) {
    window.latestEvents.sort(sortFunction);
  }

  renderSortedResults(); // You’ll define this to rebuild the DOM
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

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
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
        container.innerHTML = `No events found for ${city}.`;
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