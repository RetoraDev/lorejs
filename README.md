# LORE.js - Line-Oriented Role-playing Engine

```
   __                    ______
  / /  ___  _______  __ / / __/
 / /__/ _ \/ __/ -_)/ // /\ \  
/____/\___/_/  \__(_)___/___/  
```

A lightweight Line-Oriented Role-playing Engine for Node.JS and Browsers.

REPL-style text engine. Small and easy to use, highly customizable supporting themes and plugins with a modular structure while keeping everything simple.

## Features

- Cross-platform: Works in Node.js and browsers
- Text formatting: Rich text support with color codes and styles
- Modular design: Easy to extend with plugins and themes
- Simple API: Intuitive commands and easy game creation
- Auto-saving: Optional automatic save state management
- Customizable: Themes, plugins, and flexible game structure

## Installation

Node.JS Usage

Install with NPM:

```sh
npm install lorejs
```

Then import it to your project:

```js
const LORE = require("lorejs");

const game = new LORE.Game();
```

You can also import the lore.js file directly without installing:

```js
const LORE = require("./lore.js");

const game = new LORE.Game();
```

## Browser Usage

Simply add lore.js to your HTML:

```html
<script src="lore.js"></script>
<script>
  const game = new LORE.Game();
</script>
```

See `index.html` for a full browser implementation

## Quick Start

```js
const LORE = require("lorejs");
const game = new LORE.Game();

// Load a novel
game.loadNovel({
  title: "My Adventure",
  startRoom: "start",
  rooms: [
    {
      id: "start",
      name: "The Forest",
      description: "You are in a dense forest. A path leads north.",
      exits: { north: "clearing" }
    },
    {
      id: "clearing",
      name: "The Clearing", 
      description: "A peaceful clearing with a small cabin to the east.",
      exits: { south: "start", east: "cabin" }
    }
  ]
});

// Start the game
game.start();
```

## Creating a Novel

A novel is a JavaScript object containing all story data. You can create it as an object or export it from a module.

Basic Novel Structure

```js
module.exports = {
  title: "Sample Novel",
  startRoom: "room1",
  rooms: [
    {
      id: "room1",
      name: "The Forest",
      description: "You are in a dense forest. The trees are tall. A path leads north.",
      exits: {
        north: "room2"
      },
      items: ["torch"]
    }
  ],
  items: [
    {
      id: "torch",
      name: "Torch",
      takeable: true,
      use: (args, engine) => {
        engine.printLine('The torch flickers brightly, illuminating the area.');
        return true;
      }
    }
  ]
};
```

## Loading Novels

You can load novels from objects or files:

```js
// From an object
game.loadNovel(novelObject);

// From a local file (Node.js only)
game.loadNovel('./sample/sample_novel.js');

// From a URL (Browser only)
game.loadNovel('https://example.com/novel.js');
```

## Text Formatting

LORE.js supports rich text formatting using double curly braces:

```js
{
  name: "{{bold}}{{red}}The Forest{{font_reset}}",
  description: "You are in a {{green}}dense forest{{color_reset}}. The trees are {{bold}}tall{{font_reset}}."
}
```

### Available formatting options:

- Colors: {{red}}, {{green}}, {{blue}}, {{yellow}}, {{cyan}}, {{magenta}}, {{white}}, {{black}}
- Styles: {{bold}}, {{italic}}, {{underline}}
- Resets: {{color_reset}}, {{font_reset}}

## Plugins

Extend functionality with plugins:

```js
// sample_plugin.js
module.exports = {
  id: "sample_plugin",
  commands: {
    greeting() {
      this.printLine("Hello Adventurer!");
    }
  }
}

// Load the plugin
game.loadPlugin('./sample/sample_plugin.js');
```

## Themes

Customize the appearance with themes:

```js
// sample_theme.js
module.exports = {
  "--lore-bg-color": "#2d2d2d",
  "--lore-text-color": "#f0f0f0",
  "--lore-prompt-color": "#00ff00",
  "--lore-input-color": "#f0f0f0",
  "--lore-font-family": "monospace",
  "--lore-prompt-content": "{{green}}❯{{color_reset}} "
};

// Load the theme
game.loadTheme('./sample/sample_theme.js');
```

## Available Commands

- look - View current room description
- go [direction] - Move to a different room
- take [item] - Pick up an item
- use [item] - Use an item
- inventory - View carried items
- save - Save game state
- load - Load game state
- help - Show available commands

## Sample Files

The repository includes sample files in the sample/ directory:

- sample_novel.js - Example game structure
- sample_plugin.js - Example plugin
- sample_theme.js - Example theme

## Building from Source

To build LORE.js from source:

1. Clone the repository
2. Organize your source code in the src/ directory
3. Run the build script:

```sh
node build.js
```

This will create:

- lore.js - The full source code
- lore.min.js - Minified version

## Project Structure

```
src/
  ├── constants/
  │   ├── ANSI.js
  │   └── Defaults.js
  ├── core/
  │   ├── Game.js
  │   └── Utils.js
  └── main.js
```

## API Reference

See API Reference [here](./documentation.md)

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: git checkout -b feature-name
3. Make your changes
4. Test your changes
5. Submit a pull request

## TODO Features

- Enhanced save/load system with multiple slots
- Dialogue system with NPC interactions
- Combat mechanics
- Quest tracking system
- Audio support
- Enhanced plugin API
- More text formatting options
- Mobile-responsive UI improvements
- Localization support
- Interactive fiction standard format support

## License

Apache License 2.0 - See [LICENSE](./LICENSE) file for details.

## Support

If you have questions or need help:

- Create an issue on GitHub
- Check the sample files for examples
- Review the API documentation

Happy coding