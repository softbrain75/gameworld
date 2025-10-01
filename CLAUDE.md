# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"게임세상" (Game World) is a collection of standalone HTML5 browser games written in Korean. Each game is self-contained in a single HTML file with embedded CSS and JavaScript. The games use HTML5 Canvas API for rendering and are optimized for both desktop and mobile devices.

## Repository Structure

- `index.html` - Main landing page that lists all games
- Individual game files (e.g., `galaxy_war.html`, `xwing.html`, `cannon_defender.html`)
- Each game is a complete, standalone HTML file with no external dependencies
- `.claude/settings.local.json` - Claude Code permissions configuration

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

## Sound Effects API

**ElevenLabs API Credentials** (for adding sound effects to games):
- API Key ID: `SjDuvo7Vugpf0tr9Oh1q`
- API Secret: `D9vuDEN4mNhF45N04z9XYlINiyNkTSxYHgvki6LJ`

When creating new games, consider adding sound effects using the ElevenLabs API to enhance gameplay experience. Sound effects should be optional and not interfere with gameplay if loading fails.

### Example Sound Integration Pattern

```javascript
// Load sound effect
async function playSound(text) {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/...', {
            method: 'POST',
            headers: {
                'xi-api-key': 'SjDuvo7Vugpf0tr9Oh1q'
            },
            body: JSON.stringify({ text })
        });
        const audio = new Audio(URL.createObjectURL(await response.blob()));
        audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        // Silently fail if sound doesn't load
    }
}
```

## Testing Considerations

- Test game mechanics on both desktop and mobile
- Verify high score persistence across page refreshes
- Ensure canvas scales correctly on different screen sizes
- Check that touch events don't trigger unwanted browser behaviors
- Verify game over conditions work correctly
- Test sound effects (if implemented) on various devices and browsers
