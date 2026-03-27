# DodamSys - Rover Management System

A modern React + TypeScript application for managing and monitoring rover fleets.

## Features

- **Dashboard**: Real-time overview of fleet metrics
- **Rover Management**: View and manage available rovers
- **Bookings**: Track and manage rover bookings
- **Reports**: Generate insights and reports
- **Dark Theme UI**: Modern Material-UI based design

## Tech Stack

- **Frontend Framework**: React 19.2.4
- **Language**: TypeScript 5.3.3
- **UI Library**: Material-UI (MUI) 7.3.9
- **Build Tool**: React Scripts / Vite (optional)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **Styling**: Emotion + MUI styled-components
- **Code Quality**: ESLint, Prettier

## Project Structure

```
src/
├── components/          # Reusable components
│   └── Step3Frame.tsx  # Main Rover Management Dashboard
├── services/           # API services
│   ├── api.ts         # Axios client configuration
│   └── roverService.ts # Rover API endpoints
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── pages/             # Page components
├── App.tsx            # Root component with routing
├── index.tsx          # Application entry point
└── index.css          # Global styles
```

## Installation

### Prerequisites

- Node.js >= 16.x
- npm or yarn package manager

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Create environment file**

```bash
cp .env.example .env
```

3. **Configure API endpoint** (optional)

Edit `.env` and update `REACT_APP_API_URL` if needed:

```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ENV=development
```

## Available Scripts

### Development Server

```bash
npm start
```

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.

### Build for Production

```bash
npm run build
```

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes for the best performance.

### Type Checking

```bash
npm run type-check
```

Performs TypeScript type checking without emitting files.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### Code Formatting

```bash
npm run format
```

Formats code using Prettier.

### Run Tests

```bash
npm test
```

Launches the test runner in interactive watch mode.

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking enabled
- Target: ES2020
- JSX: react-jsx

### ESLint Configuration (`.eslintrc.json`)
- Extended React App config
- TypeScript support enabled
- React Hooks rules enforced

### Prettier Configuration (`.prettierrc`)
- 2-space indentation
- Single quotes for JS/TS
- 100-character line width

### Vite Configuration (`vite.config.ts`)
- React plugin for fast refresh
- API proxy to backend
- Optimized build output

## Step 3 Frame - Dashboard Component

The main dashboard component (`Step3Frame.tsx`) includes:

- **Left Sidebar**: Navigation menu with Dashboard, Rovers, Bookings, Reports, and Settings
- **Header Section**: Title and subtitle for the page
- **Stat Cards**: Display key metrics
  - Active Rovers
  - Total Bookings
  - Monthly Revenue
  - In Maintenance
- **Rovers Table**: List of available rovers with:
  - Model name
  - Availability status
  - Location
  - Daily rental rate
  - Action buttons (Request/Unavailable)

### Styling

The component uses Material-UI with custom styled components featuring:
- Dark theme (#121212 background)
- Orange accent color (#ff9500)
- Consistent spacing and typography
- Responsive grid layout

## Backend Integration

The application expects the backend API at `http://localhost:8080/api` with the following endpoints:

- `GET /api/rovers` - Get all rovers
- `GET /api/rovers/:id` - Get rover details
- `POST /api/rovers` - Create new rover
- `PUT /api/rovers/:id` - Update rover
- `DELETE /api/rovers/:id` - Delete rover
- `GET /api/rovers?status=Available` - Get available rovers
- `POST /api/rovers/:id/request` - Request rover booking

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Best Practices

1. **Type Definitions**: Always define types for props and API responses
2. **Component Organization**: Keep components focused and reusable
3. **API Calls**: Use services for all API communication
4. **Error Handling**: Implement proper error handling and user feedback
5. **Code Quality**: Run linting and formatting before committing

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | http://localhost:8080/api | Backend API endpoint |
| `REACT_APP_ENV` | development | Environment mode |

## Troubleshooting

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
npm install
```

### TypeScript Errors

Run type checking to catch issues:

```bash
npm run type-check
```

### Port Already in Use

Change the port by modifying the vite config or set PORT environment variable:

```bash
PORT=3001 npm start
```

## Contributing

1. Create a feature branch
2. Follow the existing code style
3. Ensure tests pass
4. Run linting and formatting
5. Submit a pull request

## License

Proprietary - DodamSys
