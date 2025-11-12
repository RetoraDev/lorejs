module.exports = {
  title: "The Mysterious Forest",
  startRoom: "forest_entrance",
  rooms: [
    {
      id: "forest_entrance",
      name: "{{bold}}{{green}}Forest Entrance{{font_reset}}",
      description: "You stand at the edge of a {{green}}dense, ancient forest{{color_reset}}. Tall trees loom overhead, their branches creating a natural canopy. A {{yellow}}well-worn path{{color_reset}} leads deeper into the woods to the {{bold}}north{{font_reset}}. To the {{bold}}south{{font_reset}} lies the way back to civilization.",
      exits: {
        north: "dense_forest",
        south: "village"
      },
      tutorial: "movement",
      onEnter: (state, engine) => {
        if (!state.flags.visitedEntrance) {
          engine.printLine("{{cyan}}An old wooden sign reads: 'Beware the Whispering Woods'{{color_reset}}");
          state.flags.visitedEntrance = true;
        }
      }
    },
    {
      id: "village",
      name: "{{bold}}{{yellow}}Quiet Village{{font_reset}}",
      description: "A small, peaceful village with cottages and a central well. The villagers go about their daily routines. The forest lies to the {{bold}}north{{font_reset}}.",
      exits: {
        north: "forest_entrance"
      },
      characters: ["old_man"],
      onEnter: (state, engine) => {
        if (!state.flags.metOldMan && !state.inventory.includes("torch")) {
          engine.printLine("{{cyan}}An old man approaches you near the well.{{color_reset}}");
        }
      }
    },
    {
      id: "dense_forest",
      name: "{{bold}}{{red}}The Whispering Woods{{font_reset}}",
      description: "You are deep in the {{green}}dense forest{{color_reset}}. The trees are {{bold}}ancient and towering{{font_reset}}, and the air feels {{cyan}}colder here{{color_reset}}. Strange whispers seem to come from all directions. Paths lead {{yellow}}north{{color_reset}} and {{yellow}}south{{color_reset}}.",
      exits: {
        south: "forest_entrance",
        north: "ancient_oak"
      },
      items: ["torch"],
      onEnter: (state, engine) => {
        if (!state.flags.visitedWhisperingWoods) {
          engine.printLine("{{magenta}}The whispers grow louder as you enter...{{color_reset}}");
          state.flags.visitedWhisperingWoods = true;
        }
        if (!state.inventory.includes("torch") && !state.flags.torchPickedUp) {
          engine.printLine("{{yellow}}You notice a {{red}}torch{{yellow}} leaning against a tree.{{color_reset}}");
        }
      }
    },
    {
      id: "ancient_oak",
      name: "{{bold}}{{blue}}Ancient Oak Tree{{font_reset}}",
      description: "A massive {{brown}}oak tree{{color_reset}} stands here, its trunk wider than three men. Carved symbols cover its bark. There's a {{yellow}}small opening{{color_reset}} in the trunk leading {{bold}}east{{font_reset}}. The path continues {{bold}}north{{font_reset}} toward a stone structure.",
      exits: {
        south: "dense_forest",
        north: "locked_chamber",
        east: "tree_hollow"
      },
      onEnter: (state, engine) => {
        if (!state.flags.foundTreeHollow) {
          engine.printLine("{{cyan}}You notice something glinting from the hollow in the tree...{{color_reset}}");
          state.flags.foundTreeHollow = true;
        }
      }
    },
    {
      id: "tree_hollow",
      name: "{{bold}}{{magenta}}Tree Hollow{{font_reset}}",
      description: "You're inside the hollow of the great oak. It's surprisingly spacious and dry. {{yellow}}Sunlight filters{{color_reset}} through small openings in the wood.",
      exits: {
        west: "ancient_oak"
      },
      items: ["rusty_key"],
      condition: (state) => state.flags.foundTreeHollow,
      blockedMessage: "{{red}}You don't see anything of interest in the tree hollow from here.{{color_reset}}",
      onEnter: (state, engine) => {
        if (!state.flags.visitedHollow) {
          engine.printLine("{{green}}This would make a perfect shelter during a storm.{{color_reset}}");
          state.flags.visitedHollow = true;
        }
      }
    },
    {
      id: "locked_chamber",
      name: "{{bold}}{{red}}* LOCKED CHAMBER *{{font_reset}}",
      description: "A {{gray}}stone door{{color_reset}} blocks your path. It's covered in {{blue}}mysterious runes{{color_reset}} and has a {{yellow}}keyhole{{color_reset}} shaped like an oak leaf. The path back {{bold}}south{{font_reset}} is clear.",
      exits: {
        north: "treasure_room",
        south: "ancient_oak"
      },
      // This room is locked by default - condition checks if player has the key
      condition: (state) => state.inventory.includes("rusty_key"),
      blockedMessage: "{{red}}The stone door is firmly locked. You need a special key to open it.{{color_reset}}",
      onEnter: (state, engine) => {
        if (!state.flags.chamberUnlocked) {
          engine.printLine("{{green}}The rusty key fits perfectly! The stone door grinds open.{{color_reset}}");
          state.flags.chamberUnlocked = true;
          
          // Add treasure after unlocking
          setTimeout(() => {
            engine.printLine("{{yellow}}As the door opens, you see a glimmering chest inside!{{color_reset}}");
          }, 1000);
        }
      }
    },
    {
      id: "treasure_room",
      name: "{{bold}}{{yellow}}*** TREASURE ROOM ***{{font_reset}}",
      description: "You've found it! A {{yellow}}hidden chamber{{color_reset}} filled with {{gold}}ancient treasures{{color_reset}}. Golden coins, jewels, and artifacts from a forgotten time fill the room. In the center rests the {{cyan}}Crystal of Wisdom{{color_reset}}.",
      exits: {
        south: "locked_chamber"
      },
      items: ["crystal"],
      onEnter: (state, engine) => {
        if (!state.flags.foundTreasure) {
          engine.printLine("{{bold}}{{magenta}}Congratulations! You've discovered the lost treasure of the Whispering Woods!{{font_reset}}");
          state.flags.foundTreasure = true;
          
          // Game completion
          setTimeout(() => {
            engine.printLine("{{bold}}{{green}}THE END{{font_reset}}");
            engine.printLine("{{cyan}}Thank you for playing! Type 'restart' to play again or 'quit' to exit.{{color_reset}}");
          }, 2000);
        }
      }
    }
  ],
  items: [
    {
      id: "torch",
      name: "{{red}}Wooden Torch{{color_reset}}",
      takeable: true,
      description: "A sturdy wooden torch. It could provide light in dark places.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.id === "dense_forest" || room.id === "tree_hollow") {
          engine.printLine('The {{red}}torch{{color_reset}} {{yellow}}flickers to life{{color_reset}}, casting warm light that seems to quiet the forest whispers.');
          if (room.id === "dense_forest" && !state.flags.torchUsedInWoods) {
            engine.printLine("{{green}}In the torchlight, you notice previously hidden carvings on the trees pointing north.{{color_reset}}");
            state.flags.torchUsedInWoods = true;
          }
        } else {
          engine.printLine('The {{red}}torch{{color_reset}} {{yellow}}burns brightly{{color_reset}}, but there\'s nothing here that needs illumination.');
        }
        return true;
      }
    },
    {
      id: "rusty_key",
      name: "{{yellow}}Rusty Oak Key{{color_reset}}",
      takeable: true,
      description: "An old, rusty key shaped like an oak leaf. It looks ancient.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.id === "locked_chamber") {
          engine.printLine("{{green}}You use the key on the stone door. It turns with a satisfying click!{{color_reset}}");
          // The room will now be accessible via its condition check
          return true;
        } else {
          engine.printLine("There's nothing here to use the key on.");
          return false;
        }
      }
    },
    {
      id: "crystal",
      name: "{{cyan}}Crystal of Wisdom{{color_reset}}",
      takeable: true,
      description: "A beautiful, glowing crystal that seems to contain ancient knowledge.",
      use: (state, engine) => {
        engine.printLine("{{bold}}{{magenta}}As you hold the crystal, visions of the forest's history flood your mind...{{font_reset}}");
        engine.printLine("{{cyan}}You see ancient guardians, forgotten rituals, and the true purpose of this sacred place.{{color_reset}}");
        if (!state.flags.understoodCrystal) {
          engine.printLine("{{green}}You feel wiser and more connected to the natural world.{{color_reset}}");
          state.flags.understoodCrystal = true;
        }
        return true;
      }
    }
  ],
  characters: [
    {
      id: "old_man",
      name: "{{bold}}Old Man{{font_reset}}",
      description: "An elderly villager with a long white beard and kind eyes.",
      talk: (state, engine) => {
        if (!state.flags.metOldMan) {
          engine.printLine("{{cyan}}Old Man: 'Ah, a traveler! Be careful in the Whispering Woods to the north.'{{color_reset}}");
          engine.printLine("{{cyan}}Old Man: 'Many have entered, but few return with their sanity. Take this advice - light reveals what darkness hides.'{{color_reset}}");
          state.flags.metOldMan = true;
        } else if (!state.inventory.includes("torch")) {
          engine.printLine("{{cyan}}Old Man: 'Remember, light reveals what darkness hides. You'll need illumination in those deep woods.'{{color_reset}}");
        } else if (state.inventory.includes("torch") && !state.flags.foundTreasure) {
          engine.printLine("{{cyan}}Old Man: 'I see you're prepared! Follow the ancient symbols. They say the great oak holds secrets.'{{color_reset}}");
        } else if (state.flags.foundTreasure) {
          engine.printLine("{{cyan}}Old Man: 'By the gods! You found the ancient treasure! The legends were true!'{{color_reset}}");
        } else {
          engine.printLine("{{cyan}}Old Man: 'May the forest guide your path, traveler.'{{color_reset}}");
        }
      }
    }
  ]
};
