exports.handler = async (event, context) => {
  const path = event.path;
  const method = event.httpMethod;

  // Handle Google OAuth
  if (path === '/api/auth/google' && method === 'GET') {
    const clientId = '161392434222-lj1bvq77fgdubnncrb5nkocv05q7rp9v.apps.googleusercontent.com';
    const redirectUri = 'https://familyexp.netlify.app/api/auth/google/callback';
    const scope = 'profile email';
    
    const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    return {
      statusCode: 302,
      headers: {
        'Location': authUrl
      }
    };
  }

  // Handle user check
  if (path === '/api/auth/user' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isAuthenticated: false,
        user: null
      })
    };
  }

  // Default response
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'API is working',
      path: path,
      method: method
    })
  };
};