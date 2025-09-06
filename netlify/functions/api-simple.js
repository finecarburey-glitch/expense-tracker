exports.handler = async (event, context) => {
  const path = event.path;
  const method = event.httpMethod;

  // Handle different routes
  if (path === '/api/auth/google' && method === 'GET') {
    return {
      statusCode: 302,
      headers: {
        'Location': 'https://accounts.google.com/oauth/authorize?client_id=161392434222-lj1bvq77fgdubnncrb5nkocv05q7rp9v.apps.googleusercontent.com&redirect_uri=https://familyexp.netlify.app/api/auth/google/callback&scope=profile email&response_type=code'
      }
    };
  }

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
