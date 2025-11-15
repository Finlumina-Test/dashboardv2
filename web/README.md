# VOX Restaurant Dashboard

A real-time multi-restaurant dashboard for managing voice calls, orders, and transcripts. Built with React Router v7, Vite, and WebSocket technology.

![VOX Dashboard](https://ucarecdn.com/318a2f4a-0da5-416c-b58e-d4512d02da5e/-/format/auto/)

> **Backend Integration**: This dashboard connects to the [Vox-OpenAI-Database](https://github.com/Finlumina-Test/Vox-OpenAI-Database) AI voice agent backend via WebSocket for real-time call management.

## Features

- 🎙️ **Real-time Call Management** - Handle multiple concurrent calls with live audio streaming
- 📝 **Live Transcription** - Real-time speech-to-text transcription of customer conversations
- 🍽️ **Order Management** - Track and manage orders as they come in
- 📊 **Multi-Restaurant Support** - Manage multiple restaurant locations from one dashboard
- 🌍 **Multi-language** - Support for English and Urdu
- 📱 **Responsive Design** - Mobile-friendly interface
- 🔒 **Secure Authentication** - Restaurant-specific login system
- 📞 **Call Takeover** - Ability to manually take over AI calls when needed
- 📈 **Call History** - View and search past call records

## Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router v7
- **Build Tool**: Vite
- **Server**: Hono (via react-router-hono-server)
- **Styling**: Tailwind CSS, Chakra UI
- **Real-time**: WebSocket
- **Language**: TypeScript/JavaScript
- **State Management**: Zustand, React Hooks
- **Icons**: Lucide React

## Project Structure

```
web/
├── src/
│   ├── app/                    # App routes
│   │   ├── page.jsx           # Login page
│   │   ├── dashboard/         # Dashboard routes
│   │   │   └── [restaurant]/  # Dynamic restaurant route
│   │   ├── demo/              # Demo routes
│   │   ├── root.tsx           # Root layout
│   │   └── routes.ts          # Route configuration
│   ├── components/            # React components
│   │   ├── MainDashboard.jsx
│   │   ├── LeftSidebar.jsx
│   │   ├── RightSidebar.jsx
│   │   ├── MainContent.jsx
│   │   ├── OrderPanel.jsx
│   │   ├── HistoryPanel.jsx
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   │   ├── useMultiCallWebSocket.js
│   │   ├── useDashboardState.js
│   │   ├── useCallHistory.js
│   │   └── audio/            # Audio-related hooks
│   ├── utils/                 # Utility functions
│   │   ├── restaurantConfig.js
│   │   ├── formatters.js
│   │   └── ...
│   └── __create/             # Create.xyz integration files
├── plugins/                   # Vite plugins
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

   Or with Bun:
   ```bash
   bun install
   ```

3. **Configure restaurants** (Optional)

   Edit `src/utils/restaurantConfig.js` to add/modify restaurant configurations:
   ```javascript
   const RESTAURANT_CONFIG = {
     restaurant_a: {
       baseUrl: "https://your-backend.com",
       username: "restaurant_a",
       password: "your-password",
     },
     // Add more restaurants...
   };
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Build and preview production build

## Configuration

### Restaurant Configuration

Restaurant backends are configured in `src/utils/restaurantConfig.js`:

```javascript
const RESTAURANT_CONFIG = {
  restaurant_id: {
    baseUrl: "https://backend-url.com",  // WebSocket backend URL
    username: "username",                 // Login username
    password: "password",                 // Login password
  },
};
```

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Available environment variables:
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_CREATE_BASE_URL` - Create.xyz base URL (if using)
- `NEXT_PUBLIC_PROJECT_GROUP_ID` - Project group ID (if using)

## Usage

### Login

1. Navigate to `http://localhost:4000`
2. Enter restaurant credentials (configured in `restaurantConfig.js`)
3. You'll be redirected to the restaurant-specific dashboard

### Dashboard Views

The dashboard has four main views:

1. **Dashboard** - Overview of active calls and real-time data
2. **POS** - Point of sale view with live orders
3. **Live** - Live call monitoring with transcripts
4. **History** - Search and view past call records

### Multi-Call Management

- Multiple calls appear in the left sidebar
- Click a call to select and view its details
- Active calls show a green indicator
- Audio activity is visualized with waveforms

### Call Takeover

1. Select an active call
2. Click "Take Over Call" button
3. Enable microphone when prompted
4. Speak to the customer directly
5. End takeover or end the call when done

## Deployment

### 🚀 Deploy to Render (Recommended)

This dashboard is optimized for [Render](https://render.com) deployment with automatic configuration.

**Quick Deploy:**

1. Fork/clone this repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Select this repository
5. Click "Apply" - Render will auto-deploy using `render.yaml`

**Your dashboard will be live at**: `https://vox-dashboard.onrender.com` (or your chosen name)

📖 **For detailed deployment instructions, see**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

📋 **For production setup and security**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

### Production Build (Manual)

```bash
npm run build
```

This creates a production-optimized build in the `build/` directory.

### Running in Production (Manual)

```bash
npm run start
```

### Other Deployment Options

#### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

#### Deploy to Railway

1. Connect your GitHub repository
2. Railway will auto-detect the configuration
3. Deploy

### Environment Variables in Production

Make sure to set these in your hosting platform:
- `NODE_ENV=production`
- `PORT=4000`
- Any custom `NEXT_PUBLIC_*` variables you're using

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for full environment configuration.

## Development

### Adding a New Restaurant

1. Add configuration to `src/utils/restaurantConfig.js`
2. Ensure the backend WebSocket server is running
3. Login with the new credentials

### Adding New Components

Place components in `src/components/` and import them as needed.

### Adding New Routes

Create a new `page.jsx` file in the appropriate directory under `src/app/`. Routes are automatically generated based on the file structure.

## WebSocket Integration

The dashboard connects to backend WebSocket servers for:
- Real-time call data
- Live transcriptions
- Order updates
- Audio streaming

WebSocket handlers are in `src/hooks/useMultiCallWebSocket.js`.

## Troubleshooting

### Dependency Issues

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### TypeScript Errors

The project uses JSX files which may show TypeScript warnings. These are handled via `src/global.d.ts` and don't affect functionality.

### WebSocket Connection Issues

- Ensure the backend URL is correct in `restaurantConfig.js`
- Check that the backend server is running
- Verify CORS settings on the backend
- Check browser console for detailed error messages

### Build Errors

Clean the build directory and node_modules:
```bash
rm -rf build node_modules .react-router
npm install --legacy-peer-deps
npm run build
```

## Security Notes

⚠️ **Important**: The current configuration stores credentials in `restaurantConfig.js`. For production:

1. **Move credentials to environment variables**
2. **Implement proper authentication backend**
3. **Use HTTPS for all connections**
4. **Implement rate limiting**
5. **Add CSRF protection**
6. **Regular security audits**

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Code splitting with React Router
- Lazy loading of routes
- Optimized WebSocket connections
- Efficient state management
- Production builds are minified and optimized

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private/Proprietary

## Support

For issues and questions, please contact the development team.

---

Built with ❤️ for VOX Restaurant Management
