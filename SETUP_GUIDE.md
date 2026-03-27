/**
 * SETUP GUIDE - Complete TypeScript React Project Configuration
 */

# Complete Setup Guide for DodamSys Project

## Overview

This guide provides step-by-step instructions to:
- Set up the Node.js/React project with TypeScript
- Configure all necessary tools and configurations
- Run the application locally
- Deploy to production

## Project Structure Summary

### Configuration Files

- **tsconfig.json** - TypeScript compiler configuration with strict mode enabled
- **.eslintrc.json** - ESLint configuration for code quality
- **.prettierrc** - Prettier configuration for code formatting
- **vite.config.ts** - Vite build configuration (optional, for faster builds)
- **.env.example** - Environment variables template
- **.gitignore** - Git ignore patterns
- **.editorconfig** - Editor configuration for consistent coding style

### Source Code Structure

```
src/
├── components/
│   └── Step3Frame.tsx          # Main Rover Management Dashboard
├── services/
│   ├── api.ts                  # Axios HTTP client
│   └── roverService.ts         # Rover API endpoints
├── context/
│   ├── AuthContext.tsx         # Authentication context
│   └── ThemeContext.tsx        # Theme management context
├── hooks/
│   └── useApi.ts               # Custom hook for API calls
├── config/
│   └── constants.ts            # Application constants
├── types/
│   └── index.ts                # TypeScript type definitions
├── utils/
│   └── helpers.ts              # Utility functions
├── App.tsx                     # Root app component
├── index.tsx                   # React entry point
└── index.css                   # Global styles
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- **React 19.2.4** - UI library
- **TypeScript 5.3** - Type checking
- **Material-UI 7.3** - Component library
- **React Router v7** - Routing
- **Axios** - HTTP client
- **ESLint & Prettier** - Code quality tools

### 2. Create Environment File

```bash
cp .env.example .env
```

Default configuration:
```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ENV=development
```

### 3. Configure IDE (VSCode Recommended)

#### Install Extensions

- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin

#### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Running the Application

### Development Mode

```bash
npm start
```

- Runs on http://localhost:3000
- Hot module replacement enabled
- Open DevTools for debugging

### Production Build

```bash
npm run build
```

- Optimized build in `build/` directory
- Minified and bundled code
- Ready for deployment

### TypeScript Type Checking

```bash
npm run type-check
```

Verify there are no TypeScript errors before deployment.

### Linting

```bash
npm run lint
```

Check code quality and style issues.

### Code Formatting

```bash
npm run format
```

Automatically format code according to Prettier rules.

## Component Overview - Step3Frame (Rover Management Dashboard)

### Features

1. **Responsive Sidebar Navigation**
   - LUNARIS branding
   - Menu items (Dashboard, Rovers, Bookings, Reports)
   - Settings option
   - User profile section at bottom

2. **Dashboard Metrics**
   - Active Rovers count
   - Total Bookings
   - Monthly Revenue
   - In Maintenance count
   - Change percentage badges

3. **Rovers Table**
   - Columns: Model, Status, Location, Daily Rate, Action
   - Status badges (Available/Booked)
   - Request/Unavailable buttons
   - Responsive design

4. **Dark Theme**
   - Primary color: #ff9500 (Orange)
   - Background: #121212
   - Surface: #1a1a1a
   - Borders: #333333
   - Text: #ffffff

## Backend API Integration

### Expected Backend Endpoints

The application expects these endpoints on `http://localhost:8080/api`:

```
GET    /rovers              - Get all rovers
GET    /rovers/:id          - Get rover details
POST   /rovers              - Create rover
PUT    /rovers/:id          - Update rover
DELETE /rovers/:id          - Delete rover
GET    /rovers?status=...   - Get filtered rovers
POST   /rovers/:id/request  - Request booking
```

### Example API Response Format

```json
{
  "id": 1,
  "model": "Aurora Scout X1",
  "status": "Available",
  "location": "San Francisco, CA",
  "dailyRate": 45.00
}
```

## Development Workflow

### 1. Create New Components

```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default MyComponent;
```

### 2. Use TypeScript Types

```tsx
// Define interfaces for type safety
interface Rover {
  id: number;
  model: string;
  status: 'Available' | 'Booked';
  location: string;
  dailyRate: number;
}
```

### 3. Use API Services

```tsx
// Call API through services
import { roverService } from './services/roverService';

const rovers = await roverService.getAllRovers();
```

### 4. Use Custom Hooks

```tsx
// Use custom hooks for API calls
const { data, loading, error, execute } = useApi(() => roverService.getAllRovers());
```

### 5. Use Context

```tsx
// Access context in components
const { user } = useAuth();
const { darkMode, toggleDarkMode } = useTheme();
```

## Deployment

### To Production

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Test production build locally**
   ```bash
   npm install -g serve
   serve -s build
   ```

3. **Deploy to hosting**
   - Netlify: Connect GitHub repo and deploy
   - Vercel: Similar to Netlify
   - Traditional hosting: Upload `build/` folder

### Environment Variables for Deployment

Set these environment variables on your hosting platform:

```
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=production
```

## Troubleshooting

### Port 3000 Already in Use

```bash
PORT=3001 npm start
```

### TypeScript Errors After Installation

```bash
npm run type-check
```

### Clear Node Modules and Reinstall

```bash
rm -rf node_modules package-lock.json
npm install
```

### Slow Build Times

Try using Vite instead of React Scripts:

```bash
npm install -D vite @vitejs/plugin-react
npm run build:vite
```

## Best Practices

1. **Always use TypeScript types** - Define interfaces for props and API responses
2. **Create custom hooks** - Extract logic into reusable hooks
3. **Use services for API** - Keep API logic separate from components
4. **Use contexts for global state** - Avoid prop drilling
5. **Test components** - Write unit tests for components
6. **Format code** - Run Prettier before committing
7. **Check types** - Run TypeScript check before deployment

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Material-UI Components](https://mui.com)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the component documentation
3. Check TypeScript types with `npm run type-check`
4. Review ESLint errors with `npm run lint`

---

**Last Updated**: March 27, 2026
**Project Version**: 0.1.0
**TypeScript Version**: 5.3.3
