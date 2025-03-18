# Lale: Retro Dungeon Crawler

A first-person dungeon crawler game inspired by "Istanbul Efsaneleri: Lale Savascilari". Built with Vue.js and Three.js.

## Features

- First-person 3D dungeon exploration
- Tile-based movement system (like classic dungeon crawlers)
- Interactive doors and exits
- Minimap for navigation
- Keyboard and touch controls (mobile-friendly)
- Custom dungeon map loader
- Different floor and ceiling types

## How to Run

1. Make sure you have Node.js installed on your system
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173/`)

## Controls

### Desktop Controls:

- **W** or **↑**: Move forward
- **S** or **↓**: Move backward
- **A** or **←**: Turn left
- **D** or **→**: Turn right

### Mobile Controls:

- **Virtual joystick**: Movement and looking around
- **Touch buttons**: Navigate and interact with the environment

## Game Manual

For those interested in the original game that inspired this project, we've included a comprehensive game manual. The manual contains detailed information about the game mechanics, character creation, races, weapons, magic spells ("vecizes"), and much more from the original "Istanbul Efsaneleri: Lale Savascilari" game.

[View the Game Manual](manual.md)

The manual is written in a humorous style that captures the unique atmosphere of the original Turkish game from the 1990s.

## Game Mechanics

- **Walls**: You cannot walk through walls
- **Doors**: Approach a door to open it automatically
- **Special Floor Tiles**: Different colored floor tiles indicate different areas
- **Map System**: The game uses a room-based map system converted to a tile-based representation

## Technical Details

- Built with Vue.js 3 for UI and game state management
- 3D rendering with Three.js
- Tile-based map design with room data loaded from external files
- Custom minimap implementation with HTML Canvas
- Responsive design with mobile-specific controls

### Original Map Loading

The game faithfully recreates the first level of the original "Istanbul Efsaneleri: Lale Savascilari" by:

- Deciphering the original game's map data
- Preserving the exact layout, wall placements, and special tile positions
- Replicating the room connections and door positions
- Maintaining the same starting position and key locations
- Adapting the original 2D grid-based movement system to work with our 3D rendering engine

This approach allows players who enjoyed the original game to experience the same dungeon layout with modern graphics and controls, while new players can explore this classic Turkish game for the first time.

## Project Structure

- `src/components/`: Vue components including Game.vue, MiniMap.vue, etc.
- `src/game/`: Game engine logic
  - `engine/`: Core game engine systems
  - `maps/`: Dungeon map files
  - `helpers/`: Utility functions
- `public/`: Static assets

## Development

Run development server:

```
npm run dev
```

Build for production:

```
npm run build
```

## Credits

Created as a retro game development project inspired by the Turkish video game "Istanbul Efsaneleri: Lale Savascilari".
