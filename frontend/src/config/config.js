const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    SOCKET_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: 'https://video-conference-app-wine.vercel.app', // Updated with your actual backend URL
    SOCKET_URL: 'https://video-conference-app-wine.vercel.app'    // Updated with your actual backend URL
  }
};

const environment = import.meta.env.MODE || 'development';
export default config[environment];
