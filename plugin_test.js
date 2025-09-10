const LORE = require("./lore.js");

// Create a new game instance
const game = new LORE.Game();

// Start the game
game.loadPlugin("./sample/sample_plugin.js");
game.print('Sample Plugins\nType "greeting" to trigger sample plugin\n');