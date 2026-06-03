# Weather Wave Frontend

This package contains the Weather Wave React client, built with Vite, TypeScript, and React Router.

## Scripts

- `npm run start` - start the development server
- `npm run build` - create a production build
- `npm run lint` - run ESLint across the source tree

## Mock server

Set these environment variables in a frontend `.env.local` file to enable the service-worker mock:

- `MOCK_SERVER=true`

When enabled, the app registers [`public/mock-sw.js`](./public/mock-sw.js) and serves the API locally. Mock auth, favorites, and weather data are stored in IndexedDB so they survive refreshes during development.
