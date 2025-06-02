# Real-Time Multiplayer Chess Game

A real-time multiplayer chess game built using React, TypeScript, Socket.IO, and Node.js, where players can play from different browser windows. Move validation occurs both on the frontend and backend, ensuring a synchronized and fair experience.

<p align="center"> <img src="screenshots/game.jpg" alt="Gameplay" width="600"/> </p>(Gameplay)
<img src="screenshots/main_screen.jpg" alt="Gameplay" width="600"/>
<p align="center"></p>(Joining game screen)

## Features
Real-time 1v1 chess using WebSockets.

- Players join to the game using unique Game IDs.
- Move validation on both client and server using chess.js.
- Displays current player turn and board orientation.
- Simple, responsive, and elegant UI.

## Project Structure
```
├── frontend/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   └── ChessGame.tsx     # Main game component
├── assets/                   # Game assets like images/logos
├── components/
│   │   └── ChessGame.tsx     # Main game component
│   └── ...
|   App.tsx
|   main.tsx                  # Main React access point
|   game.dto.ts               # Type definitions for receiving messages
|   index.css                 # Tailwind Styling      
├── backend/src/              # Backend (Node.js + Socket.IO)
│   ├── index.ts              # Socket server logic
│   ├── game.dto.ts           # Type definitions for messages
│   └── ...
├── screenshots/              # Game screenshots for README
│   └── game.png
├── README.md
├── package.json
└── ...
```
## Concurrent Programming Techniques
On the Server-Side (Node.js):

- Node.js uses a single-threaded event loop with non-blocking I/O.
- Socket.IO (built on top of Node.js and http module) uses asynchronous event-driven programming.
- This allows Socket.IO to handle many concurrent client connections without spawning a new thread for each.

On the Client-Side (Browser):

- Each socket connection operates independently.
- Event handlers like socket.on() are asynchronous callbacks.
- Browsers use event loops and asynchronous APIs (like setTimeout, fetch, etc.), so Socket.IO fits well into that model.

## Libraries and Tools used
Frontend:
- react
- react-chessboard
- chess.js – for validation and basic game logic
- socket.io-client
- react-hot-toast
- tailwind

Backend:
- express
- socket.io
- chess.js – for server-side move validation

## Contributions
- Paweł Blicharz - Frontend components, basic template of the frontend-backend communication; Code refactorizations
- Stanisław Pinkiewicz - Backend components, Minor frontend components, elements of comunications
- Jakub Czermański - Handling multiple user connections on backend and frontend, tracking game state on backend, re-factoring frontend