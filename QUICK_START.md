/**
 * Next steps and quick reference for the DodamSys project
 */

# Quick Start Reference

## 📋 Setup Checklist

Before you start developing:

- [ ] Run `npm install` to install all dependencies
- [ ] Create `.env` file from `.env.example`
- [ ] Verify TypeScript types: `npm run type-check`
- [ ] Start development server: `npm start`

## 🚀 Running the Project

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# In another terminal, start the backend
cd src/backend
./gradlew bootRun

# Or use Docker
docker-compose up
```

### With Docker

```bash
# Build and run all services
docker-compose up

# App will be available at http://localhost:3000
# API available at http://localhost:8080
```

## 📁 Key Files to Review

1. **src/components/Step3Frame.tsx** - Main dashboard component
2. **src/App.tsx** - Application routing and theme setup
3. **src/services/roverService.ts** - API calls for rovers
4. **tsconfig.json** - TypeScript configuration
5. **package.json** - Dependencies and scripts

## 🎨 Customization

### Change Theme Colors

Edit `src/config/constants.ts`:

```typescript
export const THEME_CONFIG = {
  palette: {
    primary: '#ff9500',  // Change orange color
    secondary: '#888888',
    // ...
  },
};
```

### Add New Pages

1. Create component in `src/components/`
2. Add route in `src/App.tsx`
3. Update navigation in `Step3Frame.tsx`

### Extend API

1. Add endpoint in `src/services/roverService.ts`
2. Define types in `src/types/index.ts`
3. Use in components via hooks

## 🔧 Development Tools

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Testing
```bash
npm test
```

## 🌐 API Integration

Backend should be running on `http://localhost:8080`

Expected endpoints:
- `GET /api/rovers` - Get all rovers
- `POST /api/rovers` - Create rover  
- `PUT /api/rovers/:id` - Update rover
- `DELETE /api/rovers/:id` - Delete rover

## 📦 Build for Production

```bash
# Create optimized production build
npm run build

# Test production build locally
npm install -g serve
serve -s build
```

## 🐛 Debug Mode

Set in `.env`:
```
REACT_APP_DEBUG=true
```

Use DevTools:
- F12 or Ctrl+Shift+I - Open DevTools
- Console tab - Check for errors
- Network tab - Monitor API calls
- React DevTools - Inspect components

## 📚 Documentation Files

- **PROJECT_SETUP.md** - Complete setup documentation
- **SETUP_GUIDE.md** - Detailed configuration guide
- **README.md** - Original CRA documentation

## 🤝 Contributing

1. Create a new branch
2. Make changes
3. Run `npm run format` to format code
4. Run `npm run lint` to check quality
5. Run `npm run type-check` for type errors
6. Commit and push

## ❓ Common Issues

### "Module not found" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
npm run type-check
```

### Port already in use
```bash
PORT=3001 npm start
```

### API connection refused
- Check backend is running on port 8080
- Verify `REACT_APP_API_URL` in `.env`

## 📞 Support / Resources

- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Material-UI: https://mui.com
- Axios: https://axios-http.com
- React Router: https://reactrouter.com

---

**Last Updated**: March 27, 2026
