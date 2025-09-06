exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Netlify function is working!',
      path: event.path,
      method: event.httpMethod
    })
  };
};
