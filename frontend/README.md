# Sportz Frontend

Real-time match data visualization dashboard built with React, TypeScript, and Tailwind CSS.

## Features

- 🔴 **Live Match Updates**: Real-time commentary via WebSocket
- 📊 **Match Dashboard**: View all current matches with scores and status
- 🎯 **Interactive UI**: Select matches to watch live commentary
- 🔌 **Connection Status**: Visual indicator for WebSocket connection state
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Vite** - Fast build tool and development server
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Native WebSocket API** - Real-time communication

## Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── Header.tsx
│   │   ├── MatchCard.tsx
│   │   └── LiveCommentaryPanel.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useLiveMatch.ts
│   ├── lib/             # Utilities and clients
│   │   ├── api.ts       # REST API client
│   │   └── ws.ts        # WebSocket client
│   ├── types/           # TypeScript type definitions
│   │   └── domain.ts
│   ├── App.tsx          # Main app component
│   ├── index.css        # Global styles with Tailwind
│   └── main.tsx         # App entry point
├── .env                 # Environment variables
├── tailwind.config.js   # Tailwind configuration
└── vite.config.ts       # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Backend server running (see main README)

### Environment Variables

Create a `.env` file in the `frontend/` directory (or copy from `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:3005
VITE_WS_URL=ws://localhost:3005/ws
```

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server (with hot reload)
pnpm dev
```

The app will be available at `http://localhost:5173/`

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Usage

1. **Start the backend server** first (see main README)
2. **Start the frontend**: `pnpm dev`
3. **Open browser** at http://localhost:5173
4. **View matches** in the left grid
5. **Click "Watch Live"** on any match to see live commentary
6. **Commentary updates** will appear in real-time in the right panel
7. **Click "Close"** to stop watching a match

## API Integration

### REST Endpoints

- `GET /matches?limit=50` - Fetch all matches
- `GET /matches/:matchId/commentary?limit=100` - Fetch commentary for a match

### WebSocket Events

**Client → Server:**

- `{ type: "subscribe", matchId: number }` - Subscribe to match updates
- `{ type: "unsubscribe", matchId: number }` - Unsubscribe from match

**Server → Client:**

- `{ type: "welcome" }` - Connection established
- `{ type: "subscribed", matchId }` - Subscription confirmed
- `{ type: "match_commentary", data: Commentary }` - New commentary event
- `{ type: "match_created", data: Match }` - New match created
- `{ type: "error", error: string }` - Error occurred

## Component Overview

### `Header`

Displays app title, WebSocket connection status, and match count from API.

### `MatchCard`

Shows match details (teams, score, status) with "Watch Live" or "Close" button.

### `LiveCommentaryPanel`

Displays real-time commentary feed for the selected match with formatted events.

### `useLiveMatch` Hook

Manages WebSocket connection, match selection, commentary caching, and API calls.

## Development Tips

- **Hot Module Replacement (HMR)**: Changes auto-reload in development
- **TypeScript**: All types are defined in `src/types/domain.ts`
- **Tailwind**: Use utility classes; custom components defined in `index.css`
- **WebSocket Reconnection**: Automatic retry with exponential backoff
- **Commentary Cache**: Previously loaded commentary is cached per match

## Troubleshooting

### WebSocket connection fails

- Ensure backend is running on the correct port
- Check `VITE_WS_URL` in `.env` matches backend WebSocket path
- Verify CORS is enabled on backend

### No matches displayed

- Check backend has matches in the database
- Verify `VITE_API_BASE_URL` in `.env` is correct
- Check browser console for API errors

### Styles not loading

- Run `pnpm install` to ensure Tailwind is installed
- Check `tailwind.config.js` content paths include your files
- Verify `@tailwind` directives are in `src/index.css`

## License

MIT
