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

async function searchEvents() {
  const datetimeInput = document.getElementById('datetime').value;
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const location = `${city}, ${state}`;

  if (!datetimeInput || !city || !state) {
    alert('Please enter a date/time, city, and state/province/country.');
    return;
  }

  const [date, time] = datetimeInput.split('T');
  const datetime = `${date}T${time}`;

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Searching...</h2>";

  try {
    const eventsRes = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${date}`);
    const eventsData = await eventsRes.json();

    const placesRes = await fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${encodeURIComponent(datetime)}`);
    const placesData = await placesRes.json();

    document.getElementById('skipButtons').style.display = 'block';

    // Render Events
    resultsDiv.innerHTML = "<h2>Events:</h2>";
    if (eventsData.events && eventsData.events.length > 0) {
      eventsData.events.forEach((event, index) => {
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

    // Render Places
    const { parks, restaurantsAndBars, activities } = placesData.places;

    resultsDiv.innerHTML += `<div id="parks-section"><h2>Open Parks</h2></div>`;
    parks.forEach(place => {
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

      document.getElementById('parks-section').appendChild(el);
    });

    resultsDiv.innerHTML += `<div id="eats-section"><h2>Restaurants & Bars</h2></div>`;
    restaurantsAndBars.forEach(place => {
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

      document.getElementById('eats-section').appendChild(el);
    });

    resultsDiv.innerHTML += `<div id="activities-section"><h2>Things to Do</h2></div>`;
    activities.forEach(place => {
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
      document.getElementById('activities-section').appendChild(el);
    });

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
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
    alert("You must be logged in and enter a friend's email.");
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
      statusEl.textContent = `✅ Success`;
      setTimeout(() => location.reload(), 1500); // Auto-refresh after 1.5s
    } else {
      statusEl.textContent = `❌ ${data.error}`;
      statusEl.style.color = 'red';
    }
  })
  .catch(err => {
    statusEl.textContent = "❌ Network error. Try again later.";
    statusEl.style.color = 'red';
    console.error("Add friend error:", err);
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
    authButton.textContent = email ? 'Logout' : 'Login';
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
});

document.addEventListener('DOMContentLoaded', () => {
  renderAuthButton();
  loadFavorites();
  loadFriends(); // 👈 Add this line
});