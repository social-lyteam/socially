// Function to search events
async function searchEvents() {
  const datetime = document.getElementById('datetime').value;
  const location = document.getElementById('location').value;

  if (!datetime || !location) {
    alert('Please enter both a date/time and a location.');
    return;
  }

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "<h2>Searching for events...</h2>";

  try {
    const response = await fetch(`http://localhost:3000/api/events?city=${encodeURIComponent(location)}&date=${datetime.split('T')[0]}`);
    const data = await response.json();

    if (!data.events || data.events.length === 0) {
      resultsDiv.innerHTML = "<h2>No events found for that date and city.</h2>";
      return;
    }

    resultsDiv.innerHTML = "<h2>Events Found:</h2>";
    data.events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-card';
      eventElement.innerHTML = `
        <img src="${event.image}" alt="${event.name}" style="width:100%; height:auto; border-radius:10px; margin-bottom:10px;">
        <strong>${event.name}</strong><br/>
        ${event.date}<br/>
        ${event.venue}<br/>
        <a href="${event.url}" target="_blank" style="color: lightblue;">View Event</a><br/>
        <small>Source: ${event.source}</small>
      `;
      resultsDiv.appendChild(eventElement);
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    resultsDiv.innerHTML = "<h2>Something went wrong. Please try again later.</h2>";
  }
}

// Facebook login function
function loginWithFacebook() {
  FB.login(function(response) {
    if (response.authResponse) {
      console.log('Welcome! Fetching your information....');
      FB.api('/me', {fields: 'name,email,id'}, function(response) {
        console.log('Successful login for: ' + response.name);
        document.getElementById('results').innerHTML = `
          <h2>Welcome, ${response.name}!</h2>
          <p>Your Facebook ID: ${response.id}</p>
          <p>Your Email: ${response.email || 'Email not available'}</p>
        `;
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  }, {scope: 'public_profile,email,user_friends'});
}
