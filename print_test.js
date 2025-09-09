const LORE = require("./lore.js");

const staticImg = `+========+
+        +
+        +
+        +
+        +
+========+`;

const animatedImg = [
  `+========+
+        +
+        +
+        +
+========+`,
  `+========+
+        +
+ .      +
+        +
+========+`,
  `+========+
+        +
+ ..     +
+        +
+========+`,
  `+========+
+        +
+ ...    +
+        +
+========+`
];

game = new LORE.Game();

game.printLine("Console print test");
game.printLine("------------------\n");
game.printLine("Testing static image print:");
game.printImg(staticImg);
game.printLine("Testing animated image print:");
game.printImg(animatedImg);
game.printLine("Testing text print:");
game.printLine("Lore.js is a lightweight, modular REPL style text adventure game engine for Node.JS and Browsers");
game.printLine("------------------\n");
