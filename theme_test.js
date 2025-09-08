const LORE = require("./lore.js");

// Create a new game instance
const game = new LORE.Game();

// Start the game
game.loadTheme("./sample/sample_theme.js");
game.print('Sample Theme');