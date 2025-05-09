let favorites = [];
let latestEvents = [];

// Search Events + Places
async function searchEvents() {
  const datetime = document.getElementById('datetime').value;
  const location = document.getElementById('location').value;

  if (!datetime || !location) {
    alert('Please enter both a date/time and a location.');
    return;
  }

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Searching...</h2>";

  try {
    // Fetch Events
    const eventsRes = await fetch(`https://socially-1-rm6w.onrender.com/api/events?city=${encodeURIComponent(location)}&date=${datetime.split('T')[0]}`);
    const eventsData = await eventsRes.json();

    // Fetch Places
    const placesRes = await fetch(`https://socially-1-rm6w.onrender.com/api/places?city=${encodeURIComponent(location)}&datetime=${encodeURIComponent(datetime)}`);
    const placesData = await placesRes.json();

    // Display Events
    resultsDiv.innerHTML = "<h2>Events:</h2>";
    if (eventsData.events && eventsData.events.length > 0) {
      latestEvents = eventsData.events;
      latestEvents.forEach((event, index) => {
        const el = document.createElement('div');
        el.className = 'event-card';
        el.innerHTML = `
          <img src="${event.image}" alt="${event.name}" style="width:100%; border-radius:10px; margin-bottom:10px;">
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

    // Display Places
    resultsDiv.innerHTML += "<h2>Open Parks, Restaurants & Bars:</h2>";
    if (placesData.places && placesData.places.length > 0) {
      placesData.places.forEach(place => {
        const el = document.createElement('div');
        el.className = 'place-card';
        el.innerHTML = `
          <img src="${place.photo}" alt="${place.name}" style="width:100%; border-radius:10px; margin-bottom:10px;">
          <strong>${place.name}</strong><br/>
          ${place.type.charAt(0).toUpperCase() + place.type.slice(1)}<br/>
          ${place.address}<br/>
          ${place.rating ? `⭐ ${place.rating}` : ""}
        `;
        resultsDiv.appendChild(el);
      });
    } else {
      resultsDiv.innerHTML += "<p>No nearby open places found.</p>";
    }

  } catch (err) {
    console.error("Error fetching data:", err);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
  }
}

// Add event to favorites
function addToFavoritesFromIndex(index) {
  const event = latestEvents[index];
  if (event) {
    favorites.push(event);
    alert(`Added "${event.name}" to your favorites!`);
  }
}

// Show favorite events
function viewFavorites() {
  const resultsDiv = document.getElementById('results');
  if (favorites.length === 0) {
    resultsDiv.innerHTML = "<h2>No favorites yet!</h2>";
    return;
  }

  resultsDiv.innerHTML = "<h2>Your Favorite Events:</h2>";
  favorites.forEach(event => {
    const el = document.createElement('div');
    el.className = 'event-card';
    el.innerHTML = `
      <img src="${event.image}" alt="${event.name}" style="width:100%; border-radius:10px; margin-bottom:10px;">
      <strong>${event.name}</strong><br/>
      ${event.date}<br/>
      ${event.venue}<br/>
      <a href="${event.url}" target="_blank">View Event</a><br/>
      <small>Source: ${event.source}</small>
    `;
    resultsDiv.appendChild(el);
  });
}

// Facebook login
function loginWithFacebook() {
  FB.login(function(response) {
    if (response.authResponse) {
      FB.api('/me', {fields: 'name,email,id'}, function(user) {
        document.getElementById('results').innerHTML = `
          <h2>Welcome, ${user.name}!</h2>
          <p>ID: ${user.id}</p>
          <p>Email: ${user.email || 'Not available'}</p>
        `;
      });
    }
  }, {scope: 'public_profile,email,user_friends'});
}
