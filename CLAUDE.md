# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"게임세상" (Game World) is a comprehensive collection of **67 standalone HTML5 browser games** with multilingual support (Korean, English, Chinese, Spanish, Portuguese). Each game is self-contained in a single HTML file with embedded CSS and JavaScript. The games use HTML5 Canvas API for rendering and are optimized for both desktop and mobile devices.

### Key Statistics
- **67 HTML5 games** (~50,000 total lines of game code)
- **5-language support** (KO, EN, ZH-CN, ES, PT)
- **Progressive Web App** (installable as native-like app)
- **Cloud-enabled** (Supabase/Firebase backend support)
- **Rich multimedia** (32 MB music, 28 MB video, 20+ MB sprites)

## Repository Structure

### Core Files
- `index.html` - Main landing page listing all 67 games (163 KB)
- `games.json` - Game catalog with multilingual metadata (50.4 KB)
- `translations.json` - UI strings in 5 languages (14 KB)
- `manifest.json` - PWA manifest for installable web app
- `package.json` - Node.js package configuration
- `server.js` - Local development HTTP server (10 KB)
- `.claude/settings.local.json` - Claude Code permissions configuration

### Game Files (67 Total)
Each game is a complete, standalone HTML file with no external dependencies:

**Featured Games:**
- `galaxy_war.html` - 3D space shooter with 5 enemy types
- `xwing.html` - Star Wars-themed TIE Fighter shooter
- `cannon_defender.html` - 5-lane tower defense with upgrades
- `line_draw_defense.html` - Drawing-based defense game
- `tower_defense.html` - Classic tower defense
- `zombie_survival.html` - Survival shooter
- `parkour_3d.html` - 3D parkour platformer
- `tetris.html`, `snake_classic.html`, `breakout.html`, `pong.html` - Classic arcade games
- `chess_master.html`, `omok.html`, `gostop_online.html`, `yut_nori.html` - Traditional board games
- Plus 53 more games across various genres (puzzle, action, rhythm, sports, strategy)

### Directories

**`/music/` (32 MB, 8 audio files)**
- `Across the Stars.mp3` (4 MB) - Space game BGM
- `Galactic Fanfare.mp3` (2.8 MB) - Victory theme
- `대포 발사.mp3`, `대포 발사2.mp3` (3.4-4.6 MB) - Cannon sound effects
- `전쟁의 노래.mp3` (2.8 MB) - War theme
- `집중 시간.mp3`, `집중 시간2.mp3` (4.9-5 MB) - Focus/concentration music
- `타워 디펜스.mp3` (5 MB) - Tower Defense theme

**`/resources/` (20 MB)**
- Knight sprite sheets (70+ PNG animation frames)
- Slash effect sprites (6 variations)
- Baseball player sprites and UI assets
- Other game assets and sprites

**`/video/` (28 MB)**
- Video assets and animations

**`/tofu_character/` (2.3 MB)**
- PNG/ - Character expressions and hair styles
- Spritesheet/ - Animation sprite sheets
- Vector/ - SVG/vector formats

**`/js/` (shared JavaScript utilities)**
- `supabaseClient.js` (18.9 KB) - Supabase database client
- `supabaseClient.js.local` (13.4 KB) - Local development version
- `gamePoints.js` (11.9 KB) - Points/scoring system

**`/memory/`**
- Study games and markdown editor

**`/gameworld-app/`**
- Android app files and configuration

**`/.github/workflows/`**
- GitHub Actions CI/CD configuration

### Documentation Files

**English Documentation:**
- `CLAUDE.md` - Project guidelines and architecture (this file)
- `FIREBASE_SETUP.md` - Firebase integration guide
- `LOCAL_SERVER.md` - Local development server instructions
- `SUPABASE_SETUP.md` - Supabase database setup

**Korean Documentation:**
- `게임메인헤더.md` - Game header/UI documentation
- `게임인트로.md` - Game introduction templates
- `배포.md` - Deployment guide
- `신규게임만들기.md` - Creating new games guide (comprehensive)

### Database Files
- `supabase_schema.sql` - Supabase database schema
- `migration_add_games_table.sql` - Games table migration
- `migration_add_username.sql` - User profile migration
- `migration_add_deleted_at.sql` - Soft delete support

### Configuration Files
- `vercel.json` - Vercel deployment configuration
- `run_server.bat`, `start_server.bat` - Windows server scripts
- `add_adsense.sh` - AdSense integration script
- `privacy.html` - Privacy policy page
- `reset-password.html` - Password reset page

## Games Architecture

### Common Patterns Across All Games

1. **Mobile-First Design**
   - All games use viewport height fix: `--vh` CSS variable
   - Touch events are handled alongside mouse events
   - `touch-action: none` prevents browser scrolling during gameplay
   - Meta tags enable web app mode on mobile devices

2. **Three-Screen State Management**
   - Menu screen (`menuScreen`) - Initial game instructions and start button
   - Playing state - Active gameplay with canvas rendering
   - Game Over screen (`gameoverScreen`) - Final score, statistics, and retry button
   - State managed via `gameState` variable: `'menu'`, `'playing'`, `'gameover'`

3. **Local Storage for High Scores**
   - High scores persist across sessions using `localStorage`
   - Pattern: `localStorage.getItem('gameName_highScore')`
   - Displayed on menu and game over screens

4. **Canvas-Based Rendering**
   - Game loop using `requestAnimationFrame`
   - Separate update and draw functions
   - Resolution-independent rendering for mobile responsiveness

5. **Korean UI Text**
   - All UI elements, instructions, and labels are in Korean
   - Bilingual commit messages (English + Korean) using heredoc format

### Game-Specific Notes

**galaxy_war.html** - 3D space shooter
- Drag camera to move view, click crosshair to fire auto-targeting projectiles
- 5 enemy types with unique explosion effects (fire, ice, poison, lightning, void)
- Radar system showing enemies within 1500 unit range
- Parallax scrolling moon background with 800+ stars

**StarWars_Xwing.html / xwing.html** - Star Wars-themed shooter (React version exists)
- Drag crosshair to aim, auto-fires when enemy is locked
- TIE Fighter enemies with health bars
- X-Wing style green/red alternating lasers

**cannon_defender.html** - 5-lane tower defense
- Enemies spawn in lanes and fall downward
- Click/tap lanes to fire cannon and destroy enemies
- Combo system and wave-based difficulty

**line_draw_defense.html** - Drawing defense game
- Draw lines with finger/mouse to create burning barriers
- Lines damage enemies on contact
- Resource management through line drawing limits

**tab_mania.html / tabtabtab.html** - Tap-based arcade games
- Simple tap/click mechanics
- High-speed reflex gameplay

## Git Workflow

### Commit Message Format

Use heredoc format for Korean commit messages:

```bash
git commit -m "$(cat <<'EOF'
English summary of changes

한글 상세 설명:
- 변경사항 1
- 변경사항 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Allowed Commands

The following git commands are pre-approved in `.claude/settings.local.json`:
- `git add`
- `git commit` (with specific message formats)
- `git push`

## Development Guidelines

### When Adding New Games

1. Create a self-contained HTML file with embedded CSS and JavaScript
2. Follow the three-screen pattern (menu → playing → gameover)
3. Implement mobile touch events alongside mouse events
4. Add viewport height fix for mobile browsers
5. Include Korean instructions and UI text
6. Implement localStorage for high score persistence
7. Add the game to `index.html` game list with emoji icon and description

### When Modifying Existing Games

1. Test on both desktop (mouse) and mobile (touch) devices
2. Preserve Korean text in UI and comments
3. Maintain the existing state management pattern
4. Update high score logic if scoring changes
5. Keep the game self-contained (no external dependencies)

### Canvas Game Loop Pattern

```javascript
function gameLoop() {
    if (gameState === 'playing') {
        updateGame();  // Update game state
        drawGame();    // Render to canvas
    }
    requestAnimationFrame(gameLoop);
}
```

### Mobile Touch Handling

```javascript
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleStart(e.touches[0]);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e.touches[0]);
});
```

## Common CSS Variables

- `--vh`: Custom viewport height property for mobile browsers
- Mobile-first responsive design with `calc(var(--vh, 1vh) * 100)`

## Sound Effects Guidelines

**Sound Design Principles:**
- **Volume**: Sound effects should be subtle and quiet, approximately 40% of background music volume (if BGM is 0.3, sound effects should be ~0.10-0.12)
- **Duration**: Keep sound effects very short (0.1 seconds or less)
- **Type**: Use sine wave (`oscillator.type = 'sine'`) for soft, non-intrusive sounds
- **Balance**: Sound effects should complement gameplay, not distract from it

### Web Audio API Pattern

All games use Web Audio API for sound effects (no external files needed):

```javascript
// Sound effects - short and quiet
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(soundType) {
    try {
        initAudio();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch(soundType) {
            case 'hit':
                oscillator.frequency.value = 400;
                gainNode.gain.value = 0.10; // 40% of BGM
                oscillator.type = 'sine';
                break;
            // Add more sound types as needed
        }

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1); // Very short
    } catch (e) {}
}
```

### Background Music Pattern

For games with background music (stored in `music/` folder):

```javascript
// Background music
let bgMusic = null;

function initBackgroundMusic() {
    if (!bgMusic) {
        bgMusic = new Audio('music/Across the Stars.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3; // Standard BGM volume
    }
}

function playBackgroundMusic() {
    initBackgroundMusic();
    bgMusic.play().catch(e => console.log('Music play failed:', e));
}

function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}
```

**Important**:
- Start background music when game starts
- Stop background music when game ends
- Sound effects should be ~40% of BGM volume for proper balance

## Technology Stack

### Frontend
- **HTML5 Canvas API** - Primary rendering engine for all games
- **Vanilla JavaScript** - No frameworks required for individual games
- **CSS3** - Mobile-first responsive design with flexbox/grid
- **Web Audio API** - Sound effects and background music

### Backend/Services (Optional)
- **Supabase** - PostgreSQL database for user data, scores, authentication
- **Firebase** - Alternative backend (authentication/database)
- **Node.js** - Local development server (`server.js`)
- **Vercel** - Deployment platform (configured via `vercel.json`)

### Mobile
- **Progressive Web App (PWA)** - Installable via `manifest.json`
- **Android App Support** - Native wrapper in `/gameworld-app/`
- **Touch Events** - Full touch gesture support
- **Viewport Optimization** - Custom `--vh` CSS variable for mobile browsers

### Data & Internationalization
- **games.json** - Centralized game metadata with multilingual descriptions
- **translations.json** - UI strings in 5 languages (KO, EN, ZH-CN, ES, PT)
- **localStorage** - Client-side high score persistence

## Internationalization (i18n)

### Supported Languages
1. **Korean (한국어)** - Primary language, all UI elements
2. **English** - Full translation coverage
3. **Chinese Simplified (简体中文)** - Game descriptions and UI
4. **Spanish (Español)** - Game descriptions and UI
5. **Portuguese (Português)** - Game descriptions and UI

### Translation Files

**`translations.json` Structure:**
```javascript
{
  "ko": { "key": "한글 텍스트" },
  "en": { "key": "English text" },
  "zh-CN": { "key": "中文文本" },
  "es": { "key": "Texto español" },
  "pt": { "key": "Texto português" }
}
```

**`games.json` Structure:**
```javascript
{
  "id": "game_id",
  "name": {
    "ko": "게임 이름",
    "en": "Game Name",
    "zh-CN": "游戏名称",
    "es": "Nombre del juego",
    "pt": "Nome do jogo"
  },
  "description": { /* same structure */ },
  "category": "액션", // Korean category
  "icon": "🎮",
  "url": "game_file.html",
  "releaseDate": "2024-01-01"
}
```

### Language Detection
- Browser language auto-detection via `navigator.language`
- User preference stored in `localStorage`
- Fallback to Korean if translation missing

## Backend Integration

### Supabase (Primary Backend)

**Setup:** See `SUPABASE_SETUP.md` for full configuration.

**Database Tables:**
- `users` - User profiles (username, email, auth)
- `games` - Game metadata and statistics
- `scores` - High scores and leaderboards
- `user_game_stats` - Per-user game statistics

**Client Usage:**
```javascript
// Import shared client
import { supabase } from './js/supabaseClient.js';

// Save high score
await supabase
  .from('scores')
  .insert({ user_id, game_id, score, date });

// Get leaderboard
const { data } = await supabase
  .from('scores')
  .select('*')
  .eq('game_id', 'galaxy_war')
  .order('score', { ascending: false })
  .limit(10);
```

**Schema Files:**
- `supabase_schema.sql` - Initial database schema
- `migration_*.sql` - Database migrations for feature additions

### Firebase (Alternative Backend)

**Setup:** See `FIREBASE_SETUP.md` for configuration.

- **Authentication** - Email/password, social login
- **Realtime Database** - Live score updates
- **Cloud Firestore** - Structured game data

### Shared Utilities (`/js/`)

**`supabaseClient.js`** - Supabase database client
```javascript
// Singleton pattern for Supabase client
// Handles authentication state
// Provides error handling wrappers
```

**`gamePoints.js`** - Points/scoring system
```javascript
// Centralized scoring logic
// Point multipliers and combos
// Achievement tracking
// Leaderboard integration
```

## Progressive Web App (PWA)

### Installation
The game collection is installable as a native-like app on mobile devices.

**`manifest.json` Configuration:**
```json
{
  "name": "게임세상",
  "short_name": "게임세상",
  "description": "67개의 HTML5 모바일 게임",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#667eea",
  "background_color": "#764ba2",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192" },
    { "src": "icon-512.png", "sizes": "512x512" }
  ]
}
```

### Features
- **Fullscreen Mode** - Immersive gameplay without browser chrome
- **Portrait Orientation** - Optimized for mobile devices
- **Offline Support** - Individual games work without internet
- **Add to Home Screen** - Install prompt on compatible devices
- **App-like Experience** - Native feel with web technologies

### Meta Tags (in game HTML files)
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.json">
```

## Local Development

### Starting the Development Server

**Option 1: Node.js**
```bash
npm start        # Starts server on localhost:8001
npm run dev      # Alternative command
```

**Option 2: Windows Batch Scripts**
```bash
run_server.bat   # Double-click to start server
start_server.bat # Alternative script
```

**Option 3: Direct Node Execution**
```bash
node server.js   # Default: http://localhost:8001
```

### Server Configuration

**Environment Variables:**
- `PORT` - Server port (default: 8001)
- `HOST` - Server host (default: localhost)

**Supported MIME Types:**
- HTML, CSS, JavaScript, JSON
- Images: PNG, JPG, GIF, SVG, ICO, WEBP
- Audio: MP3, WAV, OGG
- Video: MP4, WEBM
- Fonts: WOFF, WOFF2, TTF, OTF
- Markdown: MD

**Example:**
```bash
PORT=3000 HOST=0.0.0.0 node server.js
# Server running at http://0.0.0.0:3000
```

See `LOCAL_SERVER.md` for detailed instructions.

## Testing Considerations

### Functionality Tests
- Test game mechanics on mobile and PC
- Verify high score persistence across page refreshes
- Ensure canvas scales correctly on different screen sizes
- Check that touch events don't trigger unwanted browser behaviors
- Verify game over conditions work correctly
- Test sound effects (if implemented) on various devices and browsers

### Cross-Browser Testing
- Chrome/Edge (Chromium)
- Safari (iOS/macOS)
- Firefox
- Samsung Internet (Android)

### Mobile-Specific Tests
- Portrait and landscape orientations
- Keyboard appearance (for input fields)
- Touch gesture conflicts with browser
- PWA installation flow
- Fullscreen mode behavior
- Performance on low-end devices

### Backend Integration Tests (if applicable)
- User authentication flow
- Score submission and retrieval
- Leaderboard updates
- Offline/online state handling
- Network error recovery

### Internationalization Tests
- Language switching functionality
- Translation completeness
- RTL language support (if applicable)
- Date/number formatting by locale
