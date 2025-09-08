const LORE = require("./lore.js");

// Create a new game instance
const game = new LORE();

// Define some rooms
const room1 = {
  id: "room1",
  name: "The Forest",
  description: "You are in a dense forest. The trees are tall and the air is fresh. A path leads north.",
  exits: {
    north: "room2"
  },
  items: ["torch"]
};

const room2 = {
  id: "room2",
  name: "The Clearing",
  description: "You are in a peaceful clearing. A small cabin stands to the east.",
  exits: {
    south: "room1",
    east: "room3"
  }
};

const room3 = {
  id: "room3",
  name: "The Cabin",
  description: "You are inside a small cabin. It's cozy but empty.",
  exits: {
    west: "room2"
  },
  items: ["key"]
};

// Define some items
const torch = {
  id: "torch",
  name: "Torch",
  takeable: true,
  use: (state, engine) => {
    engine.printLine("The torch flickers brightly, illuminating the area.");
    return true;
  }
};

const key = {
  id: "key",
  name: "Rusty Key",
  takeable: true,
  description: "An old, rusty key. It might unlock something."
};

// Add elements to the game
game.addRoom(room1);
game.addRoom(room2);
game.addRoom(room3);
game.addItem(torch);
game.addItem(key);

// Start the game
game.startGame("room1");
