const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    SOCKET_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: 'https://video-conference-app-black.vercel.app',
    SOCKET_URL: 'https://video-conference-app-black.vercel.app'
  }
};

const environment = import.meta.env.MODE || 'development';
console.log('🔧 Environment mode:', environment);
console.log('🔧 Using config:', config[environment]);

export default config[environment];
