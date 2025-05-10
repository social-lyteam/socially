function showSignup() {
    document.getElementById('signupForm').style.display = 'block';
  }
  
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
  
    const res = await fetch('https://socially-1-rm6w.onrender.com/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
  
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('userId', data.user.email);
      window.location.href = "index.html";
    } else {
      document.getElementById('loginStatus').textContent = data.error || data.message;
    }
  });
  
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
  
    const res = await fetch('https://socially-1-rm6w.onrender.com/api/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
  
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('userId', data.user.id);
      window.location.href = "index.html";
    } else {
      document.getElementById('loginStatus').textContent = data.error || data.message;
    }
  });
  
  function loginWithFacebook() {
    FB.init({
      appId: '1175981624005514',
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });
  
    FB.login((response) => {
      if (response.authResponse) {
        FB.api('/me', { fields: 'id,name,email' }, async (user) => {
          const res = await fetch('https://socially-1-rm6w.onrender.com/api/login-facebook', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: user.id, name: user.name, email: user.email })
          });
  
          const data = await res.json();
          if (!data.error) {
            localStorage.setItem('userId', user.email); // fallback if no user.id
            window.location.href = "index.html";
          } else {
            document.getElementById('loginStatus').textContent = data.error;
          }
        });
      }
    }, { scope: 'email,public_profile' });
  }
  