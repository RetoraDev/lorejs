LORE Text Adventure Engine API Reference

Overview

LORE is a cross-platform text adventure game engine that works in both browser and Node.js environments. It provides a complete framework for creating interactive fiction with rich text formatting, animations, inventory systems, and plugin support.

Core Classes

Game

The main engine class that manages the game state, world, and rendering.

Constructor

```javascript
new Game(options = {})
```

Parameters:

· options (Object): Configuration options that override DEFAULT_CONFIG

Properties:

· state: Current game state including inventory, flags, and variables
· config: Engine configuration
· world: Game world containing rooms, items, characters, etc.
· plugins: Map of loaded plugins
· theme: Current theme settings

Methods

Output Methods

· print(text, instant = false, img = false): Adds text to output queue
· printLine(text = '', instant = false): Prints a line of text
· printImg(text, instant = false): Prints image/ASCII art
· clearScreen(): Clears the terminal/output
· updateLastLine(text): Replaces the last line of output
· updatePrompt(newPrompt): Changes the input prompt

Game State Management

· startGame(startRoomId): Begins the game
· restartGame(): Resets the game to initial state
· saveGame(slot = "default", silent = false): Saves game state
· loadGame(slot = "default"): Loads saved game
· deleteSave(slot = "default"): Deletes saved game
· listSaves(): Shows available save files

World Navigation

· move(direction): Moves player to adjacent room
· look(): Describes current room and contents

Inventory Management

· takeItem(itemId): Takes item from current room
· dropItem(itemId): Drops item into current room
· useItem(itemId, targetId = null): Uses item on target

Dialog System

· async confirm(prompt): Presyes/no confirmation dialog
· async selectFromList(prompt, options): Presents selection dialog

World Building

· addRoom(room): Adds room to world
· addItem(item): Adds item to world
· addCharacter(character): Adds character to world
· addEvent(event): Adds event to world

Plugin System

· async loadPlugin(plugin): Loads a plugin
· unloadPlugin(pluginId): Unloads a plugin

Theme System

· async loadTheme(theme): Applies a new theme

Novel Loading

· async loadNovel(novel): Loads a complete game/story

Utils

Utility functions used throughout the engine.

Methods

· isBrowser: Returns true if running in browser
· isNode: Returns true if running in Node.js
· deepClone(obj): Creates a deep clone of an object
· uuid(): Generates a UUID
· debounce(func, wait): Creates a debounced function
· colorNameToHex(color): Converts color name to hex
· isValidColor(color): Validates color format
· isURL(value): Checks if value is a URL
· deserializeFunction(func): Converts string to function
· async loadModule(url): Loads external module

Constants

ANSI_COLORS

ANSI color codes for terminal output:

```javascript
{
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m"
}
```

ANSI_STYLES

ANSI style codes for terminal output:

```javascript
{
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  thick: "\x1b[1m",
  strong: "\x1b[1m",
  b: "\x1b[1m",
  italic: "\x1b[3m",
  cursive: "\x1b[3m",
  i: "\x1b[3m",
  underline: "\x1b[4m",
  u: "\x1b[4m",
  blink: "\x1b[5m",
  inverse: "\x1b[7m",
  hidden: "\x1b[8m"
}
```

VERSION

Engine version string: "1.0.0"

STORAGE_KEY

Local storage key for save data: "lore_save_data"

DEFAULT_PROMPT

Default input prompt: "> "

DEFAULT_THEME

Default theme settings:

```javascript
{
  "--lore-bg-color": "#000000",
  "--lore-text-color": "#ffffff",
  "--lore-prompt-color": "#00ff00",
  "--lore-input-color": "#ffffff",
  "--lore-font-family": "monospace",
  "--lore-font-size": "16px",
  "--lore-border-color": "#333333"
}
```

DEFAULT_CONFIG

Default engine configuration:

```javascript
{
  prompt: DEFAULT_PROMPT,
  autosave: false,
  typingSpeed: 30,
  debug: false,
  clearScreenOnNovelLoad: true,
  disableTextAnimation: false
}
```

Text Formatting

LORE supports rich text formatting using double-brace syntax:

Color Formatting

· {{colorName}} - Apply color (red, green, blue, etc.)
· {{#hexCode}} - Apply hex color
· {{color_reset}} - Reset color

Style Formatting

· {{bold}} or {{b}} - Bold text
· {{italic}} or {{i}} - Italic text
· {{underline}} or {{u}} - Underlined text
· {{font_reset}} or {{fr}} - Reset all formatting

Special Formatting

· {{newline}} or {{n}} - Line break
· {{tabulator}} or {{tab}} or {{t}} - Tab character
· {{instant}}...{{/instant}} - Text that displays instantly

Data Structures

Room Object

```javascript
{
  id: string,           // Unique identifier
  name: string,         // Room name
  description: string,  // Room description
  image: string,        // ASCII art or image reference
  items: string[],      // Array of item IDs in room
  characters: string[], // Array of character IDs in room
  exits: Object,        // {direction: roomId} mappings
  condition: Function,  // Function that determines if player can enter
  blockedMessage: string, // Message shown when condition fails
  onEnter: Function     // Callback when player enters room
}
```

Item Object

```javascript
{
  id: string,           // Unique identifier
  name: string,         // Item name
  description: string,  // Item description
  takeable: boolean,    // Whether item can be taken
  use: Function,        // Function called when item is used
  useOn: Object         // {targetId: Function} mappings for specific uses
}
```

Character Object

```javascript
{
  id: string,           // Unique identifier
  name: string,         // Character name
  description: string,  // Character description
  talk: Function        // Function called when player talks to character
}
```

Command Object

```javascript
{
  name: string,         // Primary command name
  aliases: string[],    // Alternative command names
  fn: Function,         // Command implementation
  help: string,         // Help text description
  weight: number,       // Sorting weight for help display
  display: string       // Display name for help
}
```

Default Commands

The engine registers these default commands:

· help, h, ? - Show help
· look, l, see - Look around current room
· go [direction] - Move in direction
· Direction shortcuts: north/n, south/s, east/e, west/w, etc.
· take [item] - Take item from room
· drop [item] - Drop item from inventory
· inventory, i - Show inventory
· use [item] - Use item
· say [...] - Say something
· talk [character] - Talk to character
· save [slot] - Save game
· load [slot] - Load game
· restart - Restart game
· quit, exit - Quit game

Plugin System

Plugins can extend the engine with:

· Commands
· Rooms
· Items
· Characters
· Events
· Keybindings

Theme System

Themes can customize:

· Colors (background, text, prompt, input)
· Font family and size
· Prompt content
· Border colors

Browser vs Node.js

The engine automatically detects its environment and uses appropriate implementations:

Browser:

· Renders to DOM elements
· Uses CSS for styling
· Local storage for saves

Node.js:

· Uses readline for input/output
· ANSI codes for formatting
· File system for saves

Error Handling

The engine includes comprehensive error handling with optional debug mode that can be enabled in configuration.

License

Apache License 2.0 - See [LICENSE](./LICENSE) file for full license text.