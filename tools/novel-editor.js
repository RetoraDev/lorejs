(function () {
  "use strict";

  const NovelEditorPlugin = {
    id: "novel-editor",
    name: "Novel Editor",
    version: "1.0.0",
    description: "Interactive novel editor for Lore.JS",

    commands: [
      {
        name: "editor",
        aliases: ["ed", "edit"],
        fn: function (args, engine) {
          engine.editor.enterEditorMode();
        },
        help: "Enter novel editor mode",
        weight: 50
      }
    ],

    // Initialize the editor when plugin loads
    init: function (engine) {
      engine.editor = new NovelEditor(engine);
    }
  };

  class NovelEditor {
    constructor(engine) {
      this.engine = engine;
      this.isEditing = false;
      this.currentNovel = {
        name: "Untitled Novel",
        author: "Unknown",
        version: "1.0.0",
        description: "",
        startRoom: null,
        rooms: [],
        items: [],
        characters: [],
        events: []
      };
      this.currentSelection = null;
      this.editHistory = [];
      this.historyIndex = -1;

      this.setupEditorCommands();
    }

    setupEditorCommands() {
      this.editorCommands = {
        "help": { fn: () => this.showEditorHelp(), help: "Show editor commands" },
        "exit": { fn: () => this.exitEditorMode(), help: "Exit editor mode" },
        "save": { fn: (args) => this.saveNovel(args[0]), help: "Save novel to file" },
        "load": { fn: (args) => this.loadNovel(args[0]), help: "Load novel from file" },
        "new": { fn: () => this.createNewNovel(), help: "Create new novel" },
        "info": { fn: () => this.showNovelInfo(), help: "Show novel information" },
        "import": { fn: () => this.importNovel(), help: "Import novel from JS file (Browser only)" },
        "export": { fn: () => this.exportNovel(), help: "Export novel as JS file (Browser only)" },
        "room": { fn: (args) => this.roomCommand(args), help: "Room management: room list|create|edit|delete|select" },
        "goto": { fn: (args) => this.gotoRoom(args[0]), help: "Go to specific room" },
        "item": { fn: (args) => this.itemCommand(args), help: "Item management: item list|create|edit|delete" },
        "character": { fn: (args) => this.characterCommand(args), help: "Character management: character list|create|edit|delete" },
        "event": { fn: (args) => this.eventCommand(args), help: "Event management: event list|create|edit|delete" },
        "set": { fn: (args) => this.setMetadata(args), help: "Set novel metadata: set name|author|version|description|startroom" },
        "test": { fn: () => this.testNovel(), help: "Test the current novel" },
        "preview": { fn: () => this.previewRoom(), help: "Preview current room" },
        "undo": { fn: () => this.undo(), help: "Undo last change" },
        "redo": { fn: () => this.redo(), help: "Redo last change" },
        "list": { fn: () => this.listAll(), help: "List all content" }
      };
    }

    enterEditorMode() {
      this.isEditing = true;
      this.engine.updatePrompt("EDITOR> ");
      this.engine.printLine("{{bold}}{{green}}=== Lore.JS Novel Editor ==={{font_reset}}");
      this.engine.printLine("Type 'help' for available commands");
      this.engine.printLine("Type 'exit' to return to game mode");
      this.engine.printLine("");

      this.originalProcessInput = this.engine.processInput.bind(this.engine);
      this.engine.processInput = this.processEditorInput.bind(this);
    }

    exitEditorMode() {
      this.isEditing = false;
      this.engine.processInput = this.originalProcessInput;
      this.engine.updatePrompt(this.engine.config.prompt);
      this.engine.printLine("{{green}}Exited editor mode.{{font_reset}}");
    }

    processEditorInput(input) {
      if (!input.trim()) return;

      const [command, ...args] = input.trim().split(/\s+/);
      const normalizedCommand = command.toLowerCase();

      if (this.editorCommands[normalizedCommand]) {
        try {
          this.editorCommands[normalizedCommand].fn(args, this);
        } catch (error) {
          this.engine.printLine(`{{red}}Error: ${error.message}{{font_reset}}`);
        }
      } else {
        this.engine.printLine(`{{red}}Unknown editor command: ${command}{{font_reset}}`);
        this.engine.printLine("Type 'help' for available commands");
      }
    }

    // === BROWSER-ONLY COMMANDS ===
    importNovel() {
      if (this.engine.env !== 'browser') {
        this.engine.printLine("{{red}}Import command is only available in browser environment.{{font_reset}}");
        return;
      }

      this.engine.printLine("{{yellow}}Please select a novel JS file to import...{{font_reset}}");

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.display = 'none';

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const novelCode = event.target.result;
            const novel = this.evaluateNovelCode(novelCode);

            if (novel) {
              this.currentNovel = novel;
              this.editHistory = [];
              this.historyIndex = -1;
              this.engine.printLine(`{{green}}Successfully imported novel: ${novel.name}{{font_reset}}`);
              this.showNovelInfo();
            }
          } catch (error) {
            this.engine.printLine(`{{red}}Error importing novel: ${error.message}{{font_reset}}`);
          }
        };
        reader.readAsText(file);
      };

      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    }

    evaluateNovelCode(code) {
      const novelMatch = code.match(/const novel = (\{[\s\S]*?\});/);
      if (novelMatch) {
        try {
          const novelObj = (new Function(`return ${novelMatch[1]}`))();
          return this.validateNovelStructure(novelObj);
        } catch (error) {
          throw new Error(`Invalid novel format: ${error.message}`);
        }
      }

      const moduleMatch = code.match(/module\.exports = (\{[\s\S]*?\});/);
      if (moduleMatch) {
        try {
          const novelObj = (new Function(`return ${moduleMatch[1]}`))();
          return this.validateNovelStructure(novelObj);
        } catch (error) {
          throw new Error(`Invalid novel format: ${error.message}`);
        }
      }

      throw new Error("Could not find novel object in the file.");
    }

    validateNovelStructure(novelObj) {
      const validatedNovel = {
        name: novelObj.name || "Untitled Novel",
        author: novelObj.author || "Unknown",
        version: novelObj.version || "1.0.0",
        description: novelObj.description || "",
        startRoom: novelObj.startRoom || null,
        rooms: Array.isArray(novelObj.rooms) ? novelObj.rooms : [],
        items: Array.isArray(novelObj.items) ? novelObj.items : [],
        characters: Array.isArray(novelObj.characters) ? novelObj.characters : [],
        events: Array.isArray(novelObj.events) ? novelObj.events : []
      };
      return validatedNovel;
    }

    exportNovel() {
      if (this.engine.env !== 'browser') {
        this.engine.printLine("{{red}}Export command is only available in browser environment.{{font_reset}}");
        return;
      }

      const filename = this.currentNovel.name.toLowerCase().replace(/\s+/g, '-') + '.js';
      const novelCode = this.generateNovelCode();

      const blob = new Blob([novelCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.engine.printLine(`{{green}}Novel exported as: ${filename}{{font_reset}}`);
    }

    // === NOVEL MANAGEMENT ===
    createNewNovel() {
      this.currentNovel = {
        name: "Untitled Novel",
        author: "Unknown",
        version: "1.0.0",
        description: "",
        startRoom: null,
        rooms: [],
        items: [],
        characters: [],
        events: []
      };
      this.editHistory = [];
      this.historyIndex = -1;
      this.engine.printLine("{{green}}Created new novel.{{font_reset}}");
    }

    async loadNovel(filename) {
      try {
        if (!filename) {
          this.engine.printLine("{{yellow}}Usage: load <filename>{{font_reset}}");
          return;
        }

        if (!filename.endsWith('.js')) filename += '.js';
        const novel = await this.engine.prepareModule(filename);
        this.currentNovel = novel;
        this.editHistory = [];
        this.historyIndex = -1;
        this.engine.printLine(`{{green}}Loaded novel: ${novel.name}{{font_reset}}`);
      } catch (error) {
        this.engine.printLine(`{{red}}Error loading novel: ${error.message}{{font_reset}}`);
      }
    }

    saveNovel(filename) {
      if (!filename) {
        filename = this.currentNovel.name.toLowerCase().replace(/\s+/g, '-') + '.js';
      }
      if (!filename.endsWith('.js')) filename += '.js';

      if (this.engine.env === 'browser') {
        this.exportNovel();
      } else {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(process.cwd(), filename), this.generateNovelCode());
        this.engine.printLine(`{{green}}Novel saved as: ${filename}{{font_reset}}`);
      }
    }

    generateNovelCode() {
      return `// ${this.currentNovel.name}
// Generated by Lore.JS Novel Editor
// ${new Date().toLocaleDateString()}

const novel = {
    name: "${this.escapeString(this.currentNovel.name)}",
    author: "${this.escapeString(this.currentNovel.author)}",
    version: "${this.escapeString(this.currentNovel.version)}",
    description: "${this.escapeString(this.currentNovel.description)}",
    startRoom: ${this.currentNovel.startRoom ? `"${this.currentNovel.startRoom}"` : 'null'},
    
    rooms: [
${this.currentNovel.rooms.map(room => this.generateRoomCode(room)).join(',\n')}
    ],
    
    items: [
${this.currentNovel.items.map(item => this.generateItemCode(item)).join(',\n')}
    ],
    
    characters: [
${this.currentNovel.characters.map(char => this.generateCharacterCode(char)).join(',\n')}
    ],
    
    events: [
${this.currentNovel.events.map(event => this.generateEventCode(event)).join(',\n')}
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = novel;
} else {
    window.novel = novel;
}`;
    }

    escapeString(str) {
      return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    // === METADATA MANAGEMENT ===
    async setMetadata(args) {
      if (args.length < 2) {
        this.engine.printLine("{{yellow}}Usage: set <field> <value>{{font_reset}}");
        this.engine.printLine("Fields: name, author, version, description, startroom");
        return;
      }

      const field = args[0].toLowerCase();
      const value = args.slice(1).join(' ');

      switch (field) {
        case 'name':
          this.currentNovel.name = value;
          this.engine.printLine(`{{green}}Novel name set to: ${value}{{font_reset}}`);
          break;
        case 'author':
          this.currentNovel.author = value;
          this.engine.printLine(`{{green}}Author set to: ${value}{{font_reset}}`);
          break;
        case 'version':
          this.currentNovel.version = value;
          this.engine.printLine(`{{green}}Version set to: ${value}{{font_reset}}`);
          break;
        case 'description':
          this.currentNovel.description = value;
          this.engine.printLine(`{{green}}Description set.{{font_reset}}`);
          break;
        case 'startroom':
          const room = this.findRoom(value);
          if (room) {
            this.currentNovel.startRoom = room.id;
            this.engine.printLine(`{{green}}Start room set to: ${room.name}{{font_reset}}`);
          } else {
            this.engine.printLine("{{red}}Room not found.{{font_reset}}");
          }
          break;
        default:
          this.engine.printLine("{{red}}Invalid field.{{font_reset}}");
      }
      this.saveToHistory('set-metadata', { field, value });
    }

    // === ROOM MANAGEMENT ===
    roomCommand(args) {
      const subcommand = args[0] || 'list';
      switch (subcommand) {
        case 'list': this.listRooms(); break;
        case 'create': this.createRoom(args[1]); break;
        case 'edit': this.editRoom(args[1]); break;
        case 'delete': this.deleteRoom(args[1]); break;
        case 'select': this.selectRoom(args[1]); break;
        default: this.engine.printLine("{{yellow}}Usage: room list|create|edit|delete|select{{font_reset}}");
      }
    }

    listRooms() {
      if (this.currentNovel.rooms.length === 0) {
        this.engine.printLine("{{yellow}}No rooms created yet.{{font_reset}}");
        return;
      }
      this.engine.printLine("{{bold}}=== Rooms ==={{font_reset}}");
      this.currentNovel.rooms.forEach((room, index) => {
        const startIndicator = room.id === this.currentNovel.startRoom ? " {{green}}[START]{{font_reset}}" : "";
        this.engine.printLine(`${index + 1}. ${room.name} (ID: ${room.id})${startIndicator}`);
        if (room.description) {
          this.engine.printLine(`   ${room.description.substring(0, 50)}...`);
        }
      });
    }

    async createRoom(name) {
      if (!name) name = await this.prompt("Enter room name:");
      const room = {
        id: this.generateId(),
        name: name,
        description: await this.prompt("Enter room description:"),
        image: await this.prompt("Enter room image (optional):") || null,
        items: [],
        characters: [],
        exits: {},
        onEnter: null,
        onLook: null
      };
      this.currentNovel.rooms.push(room);
      if (this.currentNovel.rooms.length === 1) {
        this.currentNovel.startRoom = room.id;
        this.engine.printLine(`{{green}}Created room "${name}" and set as start room.{{font_reset}}`);
      } else {
        this.engine.printLine(`{{green}}Created room "${name}".{{font_reset}}`);
      }
      this.saveToHistory('create-room', room);
    }

    async editRoom(roomId) {
      const room = this.findRoom(roomId);
      if (!room) {
        this.engine.printLine("{{red}}Room not found.{{font_reset}}");
        return;
      }
      this.engine.printLine(`{{bold}}Editing room: ${room.name}{{font_reset}}`);
      const field = await this.selectFromList("Select field to edit:", [
        "name", "description", "image", "exits", "items", "characters"
      ]);
      if (field === -1) return;
      switch (field) {
        case 0: room.name = await this.prompt("Enter new name:", room.name); break;
        case 1: room.description = await this.prompt("Enter new description:", room.description); break;
        case 2: room.image = await this.prompt("Enter new image:", room.image); break;
        case 3: await this.editExits(room); break;
        case 4: await this.editRoomItems(room); break;
        case 5: await this.editRoomCharacters(room); break;
      }
      this.saveToHistory('edit-room', room);
      this.engine.printLine("{{green}}Room updated.{{font_reset}}");
    }

    async editExits(room) {
      this.engine.printLine("{{bold}}Current exits:{{font_reset}}");
      Object.keys(room.exits).forEach(exit => {
        this.engine.printLine(`  ${exit} -> ${room.exits[exit]}`);
      });
      const action = await this.selectFromList("Exit actions:", ["Add exit", "Remove exit", "Modify exit"]);
      if (action === -1) return;
      switch (action) {
        case 0:
          const direction = await this.prompt("Enter direction:");
          const targetRoomId = await this.prompt("Enter target room ID:");
          if (this.findRoom(targetRoomId)) {
            room.exits[direction] = targetRoomId;
            this.engine.printLine("{{green}}Exit added.{{font_reset}}");
          } else {
            this.engine.printLine("{{red}}Target room not found.{{font_reset}}");
          }
          break;
        case 1:
          const exitToRemove = await this.prompt("Enter direction to remove:");
          if (room.exits[exitToRemove]) {
            delete room.exits[exitToRemove];
            this.engine.printLine("{{green}}Exit removed.{{font_reset}}");
          }
          break;
        case 2:
          const exitToModify = await this.prompt("Enter direction to modify:");
          if (room.exits[exitToModify]) {
            const newTarget = await this.prompt("Enter new target room ID:");
            if (this.findRoom(newTarget)) {
              room.exits[exitToModify] = newTarget;
              this.engine.printLine("{{green}}Exit modified.{{font_reset}}");
            }
          }
          break;
      }
    }

    deleteRoom(roomId) {
      const room = this.findRoom(roomId);
      if (!room) {
        this.engine.printLine("{{red}}Room not found.{{font_reset}}");
        return;
      }
      this.currentNovel.rooms = this.currentNovel.rooms.filter(r => r.id !== room.id);
      if (this.currentNovel.startRoom === room.id) {
        this.currentNovel.startRoom = this.currentNovel.rooms[0] ? this.currentNovel.rooms[0].id : null;
      }
      this.currentNovel.rooms.forEach(r => {
        Object.keys(r.exits).forEach(exit => {
          if (r.exits[exit] === room.id) delete r.exits[exit];
        });
      });
      this.saveToHistory('delete-room', room);
      this.engine.printLine(`{{green}}Deleted room: ${room.name}{{font_reset}}`);
    }

    selectRoom(roomId) {
      const room = this.findRoom(roomId);
      if (room) {
        this.currentSelection = room.id;
        this.engine.printLine(`{{green}}Selected room: ${room.name}{{font_reset}}`);
      } else {
        this.engine.printLine("{{red}}Room not found.{{font_reset}}");
      }
    }

    gotoRoom(roomId) {
      const room = this.findRoom(roomId);
      if (room) {
        this.currentSelection = room.id;
        this.previewRoom();
      } else {
        this.engine.printLine("{{red}}Room not found.{{font_reset}}");
      }
    }

    async editRoomItems(room) {
      this.engine.printLine("{{bold}}Room Items:{{font_reset}}");
      room.items.forEach((itemId, index) => {
        const item = this.findItem(itemId);
        this.engine.printLine(`${index + 1}. ${item ? item.name : 'Unknown Item'}`);
      });
      const action = await this.selectFromList("Item actions:", ["Add item", "Remove item"]);
      if (action === -1) return;
      if (action === 0) {
        const itemToAdd = await this.selectFromList("Select item to add:",
          this.currentNovel.items.map(item => item.name));
        if (itemToAdd !== -1) {
          room.items.push(this.currentNovel.items[itemToAdd].id);
          this.engine.printLine("{{green}}Item added to room.{{font_reset}}");
        }
      } else {
        if (room.items.length === 0) {
          this.engine.printLine("{{yellow}}No items to remove.{{font_reset}}");
          return;
        }
        const itemToRemove = await this.selectFromList("Select item to remove:",
          room.items.map(itemId => this.findItem(itemId)?.name || 'Unknown Item'));
        if (itemToRemove !== -1) {
          room.items.splice(itemToRemove, 1);
          this.engine.printLine("{{green}}Item removed from room.{{font_reset}}");
        }
      }
    }

    async editRoomCharacters(room) {
      this.engine.printLine("{{bold}}Room Characters:{{font_reset}}");
      room.characters.forEach((charId, index) => {
        const character = this.findCharacter(charId);
        this.engine.printLine(`${index + 1}. ${character ? character.name : 'Unknown Character'}`);
      });
      const action = await this.selectFromList("Character actions:", ["Add character", "Remove character"]);
      if (action === -1) return;
      if (action === 0) {
        const charToAdd = await this.selectFromList("Select character to add:",
          this.currentNovel.characters.map(char => char.name));
        if (charToAdd !== -1) {
          room.characters.push(this.currentNovel.characters[charToAdd].id);
          this.engine.printLine("{{green}}Character added to room.{{font_reset}}");
        }
      } else {
        if (room.characters.length === 0) {
          this.engine.printLine("{{yellow}}No characters to remove.{{font_reset}}");
          return;
        }
        const charToRemove = await this.selectFromList("Select character to remove:",
          room.characters.map(charId => this.findCharacter(charId)?.name || 'Unknown Character'));
        if (charToRemove !== -1) {
          room.characters.splice(charToRemove, 1);
          this.engine.printLine("{{green}}Character removed from room.{{font_reset}}");
        }
      }
    }

    // === ITEM MANAGEMENT ===
    itemCommand(args) {
      const subcommand = args[0] || 'list';
      switch (subcommand) {
        case 'list': this.listItems(); break;
        case 'create': this.createItem(args[1]); break;
        case 'edit': this.editItem(args[1]); break;
        case 'delete': this.deleteItem(args[1]); break;
        default: this.engine.printLine("{{yellow}}Usage: item list|create|edit|delete{{font_reset}}");
      }
    }

    listItems() {
      if (this.currentNovel.items.length === 0) {
        this.engine.printLine("{{yellow}}No items created yet.{{font_reset}}");
        return;
      }
      this.engine.printLine("{{bold}}=== Items ==={{font_reset}}");
      this.currentNovel.items.forEach((item, index) => {
        this.engine.printLine(`${index + 1}. ${item.name} (ID: ${item.id})`);
        this.engine.printLine(`   ${item.description.substring(0, 50)}...`);
        this.engine.printLine(`   Takeable: ${item.takeable ? 'Yes' : 'No'}`);
      });
    }

    async createItem(name) {
      if (!name) name = await this.prompt("Enter item name:");
      const item = {
        id: this.generateId(),
        name: name,
        description: await this.prompt("Enter item description:"),
        takeable: await this.confirm("Is this item takeable?"),
        use: null
      };
      this.currentNovel.items.push(item);
      this.engine.printLine(`{{green}}Created item "${name}".{{font_reset}}`);
      this.saveToHistory('create-item', item);
    }

    async editItem(itemId) {
      const item = this.findItem(itemId);
      if (!item) {
        this.engine.printLine("{{red}}Item not found.{{font_reset}}");
        return;
      }
      this.engine.printLine(`{{bold}}Editing item: ${item.name}{{font_reset}}`);
      const field = await this.selectFromList("Select field to edit:", ["name", "description", "takeable"]);
      if (field === -1) return;
      switch (field) {
        case 0: item.name = await this.prompt("Enter new name:", item.name); break;
        case 1: item.description = await this.prompt("Enter new description:", item.description); break;
        case 2: item.takeable = await this.confirm("Is this item takeable?"); break;
      }
      this.saveToHistory('edit-item', item);
      this.engine.printLine("{{green}}Item updated.{{font_reset}}");
    }

    deleteItem(itemId) {
      const item = this.findItem(itemId);
      if (!item) {
        this.engine.printLine("{{red}}Item not found.{{font_reset}}");
        return;
      }
      this.currentNovel.items = this.currentNovel.items.filter(i => i.id !== item.id);
      this.currentNovel.rooms.forEach(room => {
        room.items = room.items.filter(id => id !== item.id);
      });
      this.saveToHistory('delete-item', item);
      this.engine.printLine(`{{green}}Deleted item: ${item.name}{{font_reset}}`);
    }

    // === CHARACTER MANAGEMENT ===
    characterCommand(args) {
      const subcommand = args[0] || 'list';
      switch (subcommand) {
        case 'list': this.listCharacters(); break;
        case 'create': this.createCharacter(args[1]); break;
        case 'edit': this.editCharacter(args[1]); break;
        case 'delete': this.deleteCharacter(args[1]); break;
        default: this.engine.printLine("{{yellow}}Usage: character list|create|edit|delete{{font_reset}}");
      }
    }

    listCharacters() {
      if (this.currentNovel.characters.length === 0) {
        this.engine.printLine("{{yellow}}No characters created yet.{{font_reset}}");
        return;
      }
      this.engine.printLine("{{bold}}=== Characters ==={{font_reset}}");
      this.currentNovel.characters.forEach((character, index) => {
        this.engine.printLine(`${index + 1}. ${character.name} (ID: ${character.id})`);
        this.engine.printLine(`   ${character.description.substring(0, 50)}...`);
      });
    }

    async createCharacter(name) {
      if (!name) name = await this.prompt("Enter character name:");
      const character = {
        id: this.generateId(),
        name: name,
        description: await this.prompt("Enter character description:"),
        talk: null
      };
      this.currentNovel.characters.push(character);
      this.engine.printLine(`{{green}}Created character "${name}".{{font_reset}}`);
      this.saveToHistory('create-character', character);
    }

    async editCharacter(charId) {
      const character = this.findCharacter(charId);
      if (!character) {
        this.engine.printLine("{{red}}Character not found.{{font_reset}}");
        return;
      }
      this.engine.printLine(`{{bold}}Editing character: ${character.name}{{font_reset}}`);
      const field = await this.selectFromList("Select field to edit:", ["name", "description"]);
      if (field === -1) return;
      switch (field) {
        case 0: character.name = await this.prompt("Enter new name:", character.name); break;
        case 1: character.description = await this.prompt("Enter new description:", character.description); break;
      }
      this.saveToHistory('edit-character', character);
      this.engine.printLine("{{green}}Character updated.{{font_reset}}");
    }

    deleteCharacter(charId) {
      const character = this.findCharacter(charId);
      if (!character) {
        this.engine.printLine("{{red}}Character not found.{{font_reset}}");
        return;
      }
      this.currentNovel.characters = this.currentNovel.characters.filter(c => c.id !== character.id);
      this.currentNovel.rooms.forEach(room => {
        room.characters = room.characters.filter(id => id !== character.id);
      });
      this.saveToHistory('delete-character', character);
      this.engine.printLine(`{{green}}Deleted character: ${character.name}{{font_reset}}`);
    }

    // === EVENT MANAGEMENT ===
    eventCommand(args) {
      const subcommand = args[0] || 'list';
      switch (subcommand) {
        case 'list': this.listEvents(); break;
        case 'create': this.createEvent(args[1]); break;
        case 'edit': this.editEvent(args[1]); break;
        case 'delete': this.deleteEvent(args[1]); break;
        default: this.engine.printLine("{{yellow}}Usage: event list|create|edit|delete{{font_reset}}");
      }
    }

    listEvents() {
      if (this.currentNovel.events.length === 0) {
        this.engine.printLine("{{yellow}}No events created yet.{{font_reset}}");
        return;
      }
      this.engine.printLine("{{bold}}=== Events ==={{font_reset}}");
      this.currentNovel.events.forEach((event, index) => {
        this.engine.printLine(`${index + 1}. ${event.name} (ID: ${event.id})`);
        this.engine.printLine(`   ${event.description.substring(0, 50)}...`);
      });
    }

    async createEvent(name) {
      if (!name) name = await this.prompt("Enter event name:");
      const event = {
        id: this.generateId(),
        name: name,
        description: await this.prompt("Enter event description:"),
        trigger: null,
        action: null
      };
      this.currentNovel.events.push(event);
      this.engine.printLine(`{{green}}Created event "${name}".{{font_reset}}`);
      this.saveToHistory('create-event', event);
    }

    async editEvent(eventId) {
      const event = this.findEvent(eventId);
      if (!event) {
        this.engine.printLine("{{red}}Event not found.{{font_reset}}");
        return;
      }
      this.engine.printLine(`{{bold}}Editing event: ${event.name}{{font_reset}}`);
      const field = await this.selectFromList("Select field to edit:", ["name", "description"]);
      if (field === -1) return;
      switch (field) {
        case 0: event.name = await this.prompt("Enter new name:", event.name); break;
        case 1: event.description = await this.prompt("Enter new description:", event.description); break;
      }
      this.saveToHistory('edit-event', event);
      this.engine.printLine("{{green}}Event updated.{{font_reset}}");
    }

    deleteEvent(eventId) {
      const event = this.findEvent(eventId);
      if (!event) {
        this.engine.printLine("{{red}}Event not found.{{font_reset}}");
        return;
      }
      this.currentNovel.events = this.currentNovel.events.filter(e => e.id !== event.id);
      this.saveToHistory('delete-event', event);
      this.engine.printLine(`{{green}}Deleted event: ${event.name}{{font_reset}}`);
    }

    // === UTILITY METHODS ===
    generateId() {
      return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    findRoom(identifier) {
      if (!identifier) return null;
      let room = this.currentNovel.rooms.find(r => r.id === identifier);
      if (room) return room;
      room = this.currentNovel.rooms.find(r => r.name.toLowerCase().includes(identifier.toLowerCase()));
      return room;
    }

    findItem(identifier) {
      if (!identifier) return null;
      let item = this.currentNovel.items.find(i => i.id === identifier);
      if (item) return item;
      item = this.currentNovel.items.find(i => i.name.toLowerCase().includes(identifier.toLowerCase()));
      return item;
    }

    findCharacter(identifier) {
      if (!identifier) return null;
      let character = this.currentNovel.characters.find(c => c.id === identifier);
      if (character) return character;
      character = this.currentNovel.characters.find(c => c.name.toLowerCase().includes(identifier.toLowerCase()));
      return character;
    }

    findEvent(identifier) {
      if (!identifier) return null;
      let event = this.currentNovel.events.find(e => e.id === identifier);
      if (event) return event;
      event = this.currentNovel.events.find(e => e.name.toLowerCase().includes(identifier.toLowerCase()));
      return event;
    }

    async prompt(question, defaultValue = "") {
      return new Promise((resolve) => {
        this.engine.question(question + (defaultValue ? ` [${defaultValue}]` : "") + ": ",
          (answer) => resolve(answer || defaultValue));
      });
    }

    async confirm(question) {
      return await this.engine.question(question + " (y/n): ",
        answer => answer.toLowerCase().startsWith('y'));
    }

    async selectFromList(prompt, options) {
      return await this.engine.list(options.map((opt, index) => ({
        label: opt,
        key: (index + 1).toString(),
        shortcut: (index + 1).toString()
      })), selected => options.indexOf(selected.label));
    }

    // === HISTORY MANAGEMENT ===
    saveToHistory(action, data) {
      this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
      this.editHistory.push({ action, data, timestamp: Date.now() });
      this.historyIndex = this.editHistory.length - 1;
    }

    undo() {
      if (this.historyIndex < 0) {
        this.engine.printLine("{{yellow}}Nothing to undo.{{font_reset}}");
        return;
      }
      this.historyIndex--;
      this.engine.printLine("{{green}}Undo completed.{{font_reset}}");
    }

    redo() {
      if (this.historyIndex >= this.editHistory.length - 1) {
        this.engine.printLine("{{yellow}}Nothing to redo.{{font_reset}}");
        return;
      }
      this.historyIndex++;
      this.engine.printLine("{{green}}Redo completed.{{font_reset}}");
    }

    // === HELP ===
    showEditorHelp() {
      this.engine.printLine("{{bold}}=== Novel Editor Commands ==={{font_reset}}");
      this.engine.printLine("{{bold}}{{cyan}}Basic Commands:{{font_reset}}");
      ['help', 'exit', 'new', 'info', 'save', 'load'].forEach(cmd => {
        this.engine.printLine(`  {{green}}${cmd}{{font_reset}} - ${this.editorCommands[cmd].help}`);
      });

      if (this.engine.env === 'browser') {
        this.engine.printLine("{{bold}}{{cyan}}Browser Commands:{{font_reset}}");
        ['import', 'export'].forEach(cmd => {
          this.engine.printLine(`  {{green}}${cmd}{{font_reset}} - ${this.editorCommands[cmd].help}`);
        });
      }

      this.engine.printLine("{{bold}}{{cyan}}Content Management:{{font_reset}}");
      ['room', 'item', 'character', 'event'].forEach(cmd => {
        this.engine.printLine(`  {{green}}${cmd}{{font_reset}} - ${this.editorCommands[cmd].help}`);
      });

      this.engine.printLine("{{bold}}{{cyan}}Metadata:{{font_reset}}");
      this.engine.printLine(`  {{green}}set{{font_reset}} - ${this.editorCommands['set'].help}`);

      this.engine.printLine("{{bold}}{{cyan}}Testing:{{font_reset}}");
      ['test', 'preview'].forEach(cmd => {
        this.engine.printLine(`  {{green}}${cmd}{{font_reset}} - ${this.editorCommands[cmd].help}`);
      });

      this.engine.printLine("{{bold}}{{cyan}}Utilities:{{font_reset}}");
      ['undo', 'redo', 'list'].forEach(cmd => {
        this.engine.printLine(`  {{green}}${cmd}{{font_reset}} - ${this.editorCommands[cmd].help}`);
      });
    }

    showNovelInfo() {
      this.engine.printLine("{{bold}}=== Novel Information ==={{font_reset}}");
      this.engine.printLine(`Name: ${this.currentNovel.name}`);
      this.engine.printLine(`Author: ${this.currentNovel.author}`);
      this.engine.printLine(`Version: ${this.currentNovel.version}`);
      this.engine.printLine(`Description: ${this.currentNovel.description}`);
      this.engine.printLine(`Start Room: ${this.currentNovel.startRoom || 'Not set'}`);
      this.engine.printLine(`Rooms: ${this.currentNovel.rooms.length}`);
      this.engine.printLine(`Items: ${this.currentNovel.items.length}`);
      this.engine.printLine(`Characters: ${this.currentNovel.characters.length}`);
      this.engine.printLine(`Events: ${this.currentNovel.events.length}`);
    }

    // === CODE GENERATION HELPERS ===
    generateRoomCode(room) {
      return `        {
            id: "${room.id}",
            name: "${this.escapeString(room.name)}",
            description: "${this.escapeString(room.description)}",
            image: ${room.image ? `"${this.escapeString(room.image)}"` : 'null'},
            items: ${JSON.stringify(room.items)},
            characters: ${JSON.stringify(room.characters)},
            exits: ${JSON.stringify(room.exits)}
        }`;
    }

    generateItemCode(item) {
      return `        {
            id: "${item.id}",
            name: "${this.escapeString(item.name)}",
            description: "${this.escapeString(item.description)}",
            takeable: ${item.takeable}
        }`;
    }

    generateCharacterCode(character) {
      return `        {
            id: "${character.id}",
            name: "${this.escapeString(character.name)}",
            description: "${this.escapeString(character.description)}"
        }`;
    }

    generateEventCode(event) {
      return `        {
            id: "${event.id}",
            name: "${this.escapeString(event.name)}",
            description: "${this.escapeString(event.description)}"
        }`;
    }

    // === TESTING ===
    async testNovel() {
      this.engine.printLine("{{bold}}=== Testing Novel ==={{font_reset}}");
      this.engine.printLine("{{yellow}}Test mode would launch a new game instance here.{{font_reset}}");
    }

    previewRoom() {
      if (!this.currentSelection) {
        this.engine.printLine("{{yellow}}No room selected. Use 'room select' first.{{font_reset}}");
        return;
      }
      const room = this.findRoom(this.currentSelection);
      if (room) {
        this.engine.printLine(`{{bold}}${room.name}{{font_reset}}`);
        this.engine.printLine(room.description);
        if (room.image) this.engine.printLine(`Image: ${room.image}`);
        this.engine.printLine(`Items: ${room.items.length}`);
        this.engine.printLine(`Characters: ${room.characters.length}`);
        this.engine.printLine(`Exits: ${Object.keys(room.exits).join(', ')}`);
      }
    }

    listAll() {
      this.showNovelInfo();
      this.engine.printLine("");
      this.listRooms();
      this.engine.printLine("");
      this.listItems();
      this.engine.printLine("");
      this.listCharacters();
      this.engine.printLine("");
      this.listEvents();
    }
  }

  // Register the plugin
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NovelEditorPlugin;
  } else if (typeof window !== 'undefined') {
    window.NovelEditorPlugin = NovelEditorPlugin;
  }
})();