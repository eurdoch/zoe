# Zoe Web Application

This is the web version of the Zoe fitness tracking application, built with:

- React
- TypeScript
- Vite
- Recharts (for data visualization)

## Development

From the root directory of the project, run:

```bash
# Install dependencies (if not already installed)
yarn

# Start the development server
yarn web:dev
```

This will start the development server at http://localhost:3000.

## Building for Production

To build the web application for production, run:

```bash
yarn web:build
```

The built files will be in the `web/dist` directory.

To preview the production build locally:

```bash
yarn web:preview
```

## Features

The web application provides a dashboard view of all your fitness data:

- Weight tracking
- Workout history
- Exercise progress

You can toggle different data series on and off using the checkboxes above the chart.

## Data Source

The web application connects to the same backend API as the mobile app, so all your data is synced between platforms.

By default, it connects to https://directto.link for data sync.