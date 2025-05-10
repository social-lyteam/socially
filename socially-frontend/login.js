function showSignup() {
    document.getElementById('signupForm').style.display = 'block';
  }
  
  // Handle login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
  
    if (!email || !password) {
      document.getElementById('loginStatus').textContent = 'Email and password are required.';
      return;
    }
  
    const res = await fetch('https://socially-1-rm6w.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('email', data.user.email);
      window.location.href = "index.html";
    } else {
      document.getElementById('loginStatus').textContent = data.error || data.message;
    }
  });
  
  // Handle signup
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
  
    if (!email || !password) {
      document.getElementById('loginStatus').textContent = 'Email and password are required.';
      return;
    }
  
    const res = await fetch('https://socially-1-rm6w.onrender.com/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  
    const data = await res.json();
    if (data.user) {
      localStorage.setItem('email', data.user.email);
      window.location.href = "index.html";
    } else {
      document.getElementById('loginStatus').textContent = data.error || data.message;
    }
  });
  
  // Facebook login
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, name: user.name, email: user.email })
          });
  
          const data = await res.json();
          if (!data.error) {
            localStorage.setItem('email', user.email);
            window.location.href = "index.html";
          } else {
            document.getElementById('loginStatus').textContent = data.error;
          }
        });
      }
    }, { scope: 'email,public_profile' });
  }
  