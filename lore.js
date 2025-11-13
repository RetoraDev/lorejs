/**
* Copyright 2025 RetoraDev
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    global.LORE = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  // ANSI color codes and style constants for Node.js
  const ANSI_COLORS = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m"
  };
  const ANSI_STYLES = {
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
  };

  // Constants
  const VERSION = "1.0.3";
  const STORAGE_KEY = "lore_save_data";
  const DEFAULT_PROMPT = "> ";
  const DEFAULT_THEME = {
    "--lore-bg-color": "#000000",
    "--lore-text-color": "#ffffff",
    "--lore-prompt-color": "#00ff00",
    "--lore-input-color": "#ffffff",
    "--lore-font-family": "monospace",
    "--lore-font-size": "16px",
    "--lore-border-color": "#333333"
  };
  const DEFAULT_CONFIG = {
    prompt: DEFAULT_PROMPT,
    autosave: false,
    typingSpeed: 30,
    debug: false,
    clearScreenOnNovelLoad: true,
    disableTextAnimation: false
  };

  // Utility functions
  const Utils = {
    isBrowser: typeof window !== "undefined" && typeof document !== "undefined",
    isNode: typeof process !== "undefined" && process.versions && process.versions.node,
    deepClone(obj) {
      return { ...obj };
    },
    uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    colorNameToHex(color) {
      const colors = {
        black: "#000000",
        red: "#ff0000",
        green: "#00ff00",
        yellow: "#ffff00",
        blue: "#0000ff",
        magenta: "#ff00ff",
        cyan: "#00ffff",
        white: "#ffffff"
      };
      return colors[color.toLowerCase()] || color;
    },
    isValidColor(color) {
      if (!color) return false;
      // Check if it's a named color
      const namedColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
      if (namedColors.includes(color.toLowerCase())) return true;
      // Check if it's a hex color
      return /^#?([0-9A-F]{3}){1,2}$/i.test(color);
    },
    isURL(value) {
      return value.startsWith("file://") || value.startsWith("./") || value.startsWith("../") || value.startsWith("http://") || value.startsWith("https://");
    },
    deserializeFunction(func) {
      if (typeof func === "string") {
        return new Function(`const state = arguments[0]; const engine = arguments[1]; ${func}`);
      } else {
        return func;
      }
    },
    arraysEqual(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },
    async loadModule(url) {
      try {
        const response = await fetch(url);
        const content = await response.text();
        if (!response.ok) {
          console.error("File at", url, "not found!");
          return {};
        }
        const module = new Function(`
            const module = {
              exports: {}
            };
            try {
              ${content}
            } catch(error) {
              return module;
              throw error;
            }
            return module;
          `)();
        return module.exports;
      } catch (error) {
        console.error("Error loading module from ", url, error);
        return {};
      }
    }
  };

  // Core Engine Class
  // @allow node
  class Game {
    constructor(options = {}) {
      this.state = {
        currentRoom: null,
        inventory: [],
        flags: {},
        variables: {},
        history: [],
        gameTime: 0
      };
      this.config = {
        ...DEFAULT_CONFIG,
        ...options
      };
      this.world = {
        rooms: new Map(),
        items: new Map(),
        characters: new Map(),
        events: new Map(),
        commands: new Map(),
        aliases: new Map(),
        keybindings: new Map()
      };
      this.plugins = new Map();
      this.theme = { ...DEFAULT_THEME };
      this.historyIndex = -1;
      this.queueIsRunning = false;
      this.isRunning = false;
      this.outputQueue = [];
      this.outputBuffer = [];
      this.animationFrames = new Map();
      this.animationIntervals = new Map();
      // Completion state
      this._completionState = null;
      this._nodeCompletionState = null;
      // Formatting state
      this.formattingState = {
        color: null,
        bold: false,
        italic: false,
        underline: false
      };
      // Animation state
      this.animationState = {
        isAnimating: false,
        currentAnimation: null
      };
      // Initialize based on environment
      if (Utils.isBrowser) {
        this.initBrowser();
      } else if (Utils.isNode) {
        this.initNode();
      }
      // Register default commands
      this.registerDefaultCommands();
    }
    // Environment initialization
    initBrowser() {
      this.env = "browser";
      // Create terminal elements
      this.terminalElement = document.createElement("div");
      this.terminalElement.className = "lore-terminal";
      this.terminalElement.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: ${this.theme["--lore-bg-color"]};
          color: ${this.theme["--lore-text-color"]};
          font-family: ${this.theme["--lore-font-family"]};
          font-size: ${this.theme["--lore-font-size"]};
          overflow: auto;
          padding: 20px;
          box-sizing: border-box;
        `;
      this.outputElement = document.createElement("div");
      this.outputElement.className = "lore-output";
      this.outputElement.style.cssText = `
          height: calc(100% - 60px);
          overflow-y: auto;
          margin-bottom: 20px;
          white-space: pre-wrap;
        `;
      this.inputContainer = document.createElement("div");
      this.inputContainer.className = "lore-input-container";
      this.inputContainer.style.cssText = `
          display: flex;
          align-items: center;
          background: transparent;
        `;
      this.promptElement = document.createElement("span");
      this.promptElement.className = "lore-prompt";
      this.promptElement.textContent = this.parseFormatting(this.config.prompt);
      this.inputElement = document.createElement("input");
      this.inputElement.className = "lore-input";
      this.inputElement.type = "text";
      this.inputElement.style.cssText = `
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: ${this.theme["--lore-input-color"]};
          font-family: ${this.theme["--lore-font-family"]};
          font-size: ${this.theme["--lore-font-size"]};
          margin-left: 5px;
        `;
      // Assemble terminal
      this.inputContainer.appendChild(this.promptElement);
      this.inputContainer.appendChild(this.inputElement);
      this.terminalElement.appendChild(this.outputElement);
      this.terminalElement.appendChild(this.inputContainer);
      // Add to document if not already present
      if (!document.querySelector(".lore-terminal")) {
        document.body.appendChild(this.terminalElement);
        document.body.style.margin = "0";
        document.body.style.padding = "0";
      }
      // Set up event listeners
      this.setupBrowserEvents();
    }
    initNode() {
      this.env = "node";
      this.readline = require("readline");
      this.fs = require("fs");
      this.path = require("path");
      this.rl = this.readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: this.parseFormatting(this.config.prompt)
      });
      this.setupNodeEvents();
    }
    // Event setup
    setupBrowserEvents() {
        this.inputElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            if (!this.animationState.isAnimating) {
              this.processInput(this.inputElement.value);
              this.inputElement.value = '';
              e.preventDefault();
            } else {
              this.skipAnimation();
              e.preventDefault();
            }
          } else if (e.key === 'ArrowUp') {
            this.navigateHistory(-1);
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            this.navigateHistory(1);
            e.preventDefault();
          } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
            this.autoComplete();
            e.preventDefault();
          } else if (e.key === 'Escape' && this.animationState.isAnimating) {
            this.skipAnimation();
            e.preventDefault();
          }
        });
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
          this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }, 250));
        // Focus input on terminal click
        this.terminalElement.addEventListener('click', () => {
          this.inputElement.focus();
        });
        this.inputElement.addEventListener('dblclick', e => {
          this.autoComplete();
          e.preventDefault();
        });
      }
    setupNodeEvents() {
      this.rl.on('line', (input) => {
        if (this.animationState.isAnimating) {
          this.skipAnimation();
          this.rl.prompt();
        } else {
          this.processInput(input);
          this.rl.prompt();
        }
      }).on('close', () => {
        process.exit(0);
      });
      // Handle Tab key specifically for Node.js
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.on('data', (data) => {
          // Check if it's a Tab key (ASCII 9)
          if (data.length === 1 && data[0] === 9) { // Tab key
            // Get current line from readline
            const line = this.rl.line;
            // Use our completer
            const [completions, completed] = this.readlineCompleter(line);
            if (completions.length > 0 && completed !== line) {
              // Update the readline with the completed line
              this.rl.line = completed;
              this.rl.cursor = completed.length;
              this.rl._refreshLine();
            }
            return; // Prevent default behavior
          }
          // Check for Ctrl+C (SIGINT)
          if (data.length === 1 && data[0] === 3) {
            this.rl.emit('SIGINT');
            return;
          }
        });
      }
      // Set up tab completion for Node
      this.rl.on('SIGINT', () => {
        if (this.animationState.isAnimating) {
          this.skipAnimation();
          this.rl.prompt();
        } else {
          this.rl.question('Are you sure you want to exit? (y/n) ', (answer) => {
            if (answer.match(/^y(es)?$/i)) {
              this.rl.close();
            } else {
              this.rl.prompt();
            }
          });
        }
      });
    }
    // Formatting parser
    parseFormatting(text) {
      if (this.env === 'browser') {
        return this.parseFormattingBrowser(text);
      } else {
        return this.parseFormattingNode(text);
      }
    }
    parseFormattingBrowser(text) {
      const formatRegex = /\{\{([^}]+)\}\}/g;
      let lastIndex = 0;
      let result = '';
      let match;
      // Reset formatting state
      this.formattingState = {
        color: null,
        bold: false,
        italic: false,
        underline: false
      };
      while ((match = formatRegex.exec(text)) !== null) {
        // Add text before the formatting tag
        result += text.substring(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
        // Process the formatting tag
        const tag = match[1].trim().toLowerCase();
        result += this.processSingleTag(tag);
      }
      // Add the remaining text
      result += text.substring(lastIndex);
      // Close any open formatting tags
      if (this.formattingState.underline) result += '</span>';
      if (this.formattingState.italic) result += '</em>';
      if (this.formattingState.bold) result += '</strong>';
      if (this.formattingState.color) result += '</span>';
      return result;
    }
    parseFormattingNode(text) {
      const formatRegex = /\{\{([^}]+)\}\}/g;
      let lastIndex = 0;
      let result = '';
      let match;
      // Reset formatting state
      this.formattingState = {
        color: null,
        bold: false,
        italic: false,
        underline: false
      };
      while ((match = formatRegex.exec(text)) !== null) {
        // Add text before the formatting tag
        result += text.substring(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
        // Process the formatting tag
        const tag = match[1].trim().toLowerCase();
        result += this.processSingleTag(tag);
      }
      // Add the remaining text
      result += text.substring(lastIndex);
      // Reset formatting at the end
      if (this.formattingState.color || this.formattingState.bold ||
        this.formattingState.italic || this.formattingState.underline) {
        result += ANSI_STYLES.reset;
      }
      return result;
    }
    processSingleTag(tag) {
      let result = '';
      if (this.env === 'browser') {
        if (tag === 'font_reset' || tag === 'fr') {
          result += '</span>';
          this.formattingState = {
            color: null,
            bold: false,
            italic: false,
            underline: false
          };
        } else if (tag === 'color_reset') {
          if (this.formattingState.color) {
            result += '</span>';
            this.formattingState.color = null;
          }
        } else if (Utils.isValidColor(tag)) {
          // Close previous color span if exists
          if (this.formattingState.color) {
            result += '</span>';
          }
          const color = Utils.colorNameToHex(tag.replace('#', ''));
          result += `<span style="color: ${color}">`;
          this.formattingState.color = color;
        } else if (tag === 'bold' || tag === 'thick' || tag === 'strong' || tag === 'b') {
          if (!this.formattingState.bold) {
            result += '<span style="font-weight: bold">';
            this.formattingState.bold = true;
          }
        } else if (tag === 'italic' || tag === 'cursive' || tag === 'i') {
          if (!this.formattingState.italic) {
            result += '<span style="font-style: italic">';
            this.formattingState.italic = true;
          }
        } else if (tag === 'underline' || tag === 'u') {
          if (!this.formattingState.underline) {
            result += '<span style="text-decoration: underline">';
            this.formattingState.underline = true;
          }
        } else if (tag === 'newline' || tag === 'n') {
          result += '<br>';
        } else if (tag === 'double_newline' || tag === 'dn') {
          result += '<br><br>';
        } else if (tag === 'tabulator' || tag === 'tab' || tag === 't') {
          result += '&nbsp;&nbsp;&nbsp;&nbsp;';
        } else if (tag === 'instant') {
          // Instant tag - handled in animation, just remove the tag
          result += '';
        }
      } else {
        if (tag === 'font_reset' || tag === 'fr') {
          result += ANSI_STYLES.reset;
          this.formattingState = {
            color: null,
            bold: false,
            italic: false,
            underline: false
          };
        } else if (tag === 'color_reset') {
          if (this.formattingState.color || this.formattingState.bold ||
            this.formattingState.italic || this.formattingState.underline) {
            result += ANSI_STYLES.reset;
            this.formattingState = {
              color: null,
              bold: false,
              italic: false,
              underline: false
            };
          }
        } else if (Utils.isValidColor(tag)) {
          const colorName = tag.replace('#', '');
          if (ANSI_COLORS[colorName]) {
            result += ANSI_COLORS[colorName];
            this.formattingState.color = colorName;
          }
        } else if (tag === 'bold' || tag === 'thick' || tag === 'strong' || tag === 'b') {
          if (!this.formattingState.bold) {
            result += ANSI_STYLES.bold;
            this.formattingState.bold = true;
          }
        } else if (tag === 'italic' || tag === 'cursive' || tag === 'i') {
          if (!this.formattingState.italic) {
            result += ANSI_STYLES.italic;
            this.formattingState.italic = true;
          }
        } else if (tag === 'underline' || tag === 'u') {
          if (!this.formattingState.underline) {
            result += ANSI_STYLES.underline;
            this.formattingState.underline = true;
          }
        } else if (tag === 'newline' || tag === 'n') {
          result += '\n';
        } else if (tag === 'double_newline' || tag === 'dn') {
          result += '\n\n';
        } else if (tag === 'tabulator' || tag === 'tab' || tag === 't') {
          result += '\t';
        } else if (tag === 'instant') {
          // Instant tag - handled in animation, just remove the tag
          result += '';
        }
      }
      return result;
    }
    // Command processing
    processInput(input) {
      if (!input.trim()) return;
      // Reset completion state when command is executed
      this._completionState = null;
      this._nodeCompletionState = null;
      // Interrupt any ongoing animation
      if (this.animationState.currentAnimation || this.queueIsRunning) {
        this.skipAnimation();
        return;
      }
      // Add to history
      this.state.history.push(input);
      this.historyIndex = this.state.history.length;
      // Echo input
      if (this.env === 'browser') {
        this.printLine(`${this.config.prompt}${input}`, true);
      }
      // Parse and execute command
      const [command, ...args] = input.trim().split(/\s+/);
      let normalizedCommand = command.toLowerCase();
      let commandAvailable = true;
      // Look for command aliases otherwise mark command not available
      if (!this.world.commands.has(normalizedCommand)) {
        if (this.world.aliases.has(normalizedCommand)) {
          normalizedCommand = this.world.aliases.get(normalizedCommand);
        } else {
          commandAvailable = false;
        }
      }
      if (commandAvailable) {
        try {
          const command = this.world.commands.get(normalizedCommand);
          command?.fn?.call(this, args, this);
        } catch (error) {
          this.printLine(`Error executing command: ${error.message}`);
          if (this.config.debug) {
            console.error(error);
          }
        }
      } else {
        this.printLine(`Unknown command: ${command}. Type 'help' for available commands.`);
      }
      // Autosave if enabled
      if (this.config.autosave) {
        this.saveGame('autosave', true);
      }
    }
    navigateHistory(direction) {
      if (this.state.history.length === 0) return;
      // Reset completion state when navigating history
      this._completionState = null;
      this._nodeCompletionState = null;
      this.historyIndex += direction;
      if (this.historyIndex < 0) {
        this.historyIndex = 0;
      } else if (this.historyIndex >= this.state.history.length) {
        this.historyIndex = this.state.history.length;
        this.inputElement.value = "";
        return;
      }
      this.inputElement.value = this.state.history[this.historyIndex];
    }
    autoComplete(input) {
      if (!input) {
        if (this.env === 'browser') {
          input = this.inputElement.value.trim();
        } else {
          return; // In Node.js, readline handles completion
        }
      }
      if (!input) return;
      const inputParts = input.split(" ");
      const currentWord = inputParts[inputParts.length - 1].toLowerCase();
      // Get completions using the same logic as readlineCompleter
      const completions = this.getCompletions(currentWord, inputParts, inputParts.length);
      // Filter matches based on current word
      const matches = completions.filter(completion => 
        completion.toLowerCase().startsWith(currentWord.toLowerCase())
      );
      if (matches.length === 1) {
        // Single match - complete it
        inputParts[inputParts.length - 1] = matches[0];
        if (this.env === 'browser') {
          this.inputElement.value = inputParts.join(" ");
        }
      } else if (matches.length > 1) {
        // Multiple matches - cycle through them
        // Store current completion state if not exists
        if (!this._completionState) {
          this._completionState = {
            originalInput: input,
            matches: matches,
            currentIndex: -1
          };
        } else {
          // If we're already cycling, increment index
          this._completionState.currentIndex = 
            (this._completionState.currentIndex + 1) % matches.length;
        }
        // Get the current completion
        const completion = matches[this._completionState.currentIndex];
        inputParts[inputParts.length - 1] = completion;
        if (this.env === 'browser') {
          this.inputElement.value = inputParts.join(" ");
        }
        // Reset completion state if we've cycled through all options
        if (this._completionState.currentIndex === matches.length - 1) {
          // Keep the state for next tab press to continue cycling
        }
      } else {
        // No matches - reset completion state
        this._completionState = null;
      }
    }
    readlineCompleter(line) {
      const input = line.trim();
      const parts = input.split(/\s+/);
      const currentWord = parts[parts.length - 1] || '';
      // Get all possible completions
      const completions = this.getCompletions(currentWord, parts, parts.length);
      // Filter matches based on current word
      const hits = completions.filter(completion => 
        completion.toLowerCase().startsWith(currentWord.toLowerCase())
      );
      if (hits.length > 0) {
        // Initialize or get completion state
        if (!this._nodeCompletionState || 
            this._nodeCompletionState.originalLine !== line ||
            !Utils.arraysEqual(this._nodeCompletionState.hits, hits)) {
          this._nodeCompletionState = {
            originalLine: line,
            hits: hits,
            currentIndex: -1
          };
        }
        // Cycle to next completion
        this._nodeCompletionState.currentIndex = 
          (this._nodeCompletionState.currentIndex + 1) % hits.length;
        const currentCompletion = hits[this._nodeCompletionState.currentIndex];
        // Replace the last word in the line with the completion
        const completedLine = parts.slice(0, -1).concat(currentCompletion).join(' ');
        // Return the completed line for readline to use
        return [[completedLine], completedLine];
      }
      // No matches - return original line
      return [[line], line];
    }
    getCompletions(currentWord, parts, partCount) {
      const completions = new Set();
      // Command completions (always available)
      for (const [commandName, command] of this.world.commands) {
        if (command.weight !== -1) { // Don't include hidden commands
          completions.add(commandName);
          if (command.aliases) {
            command.aliases.forEach(alias => completions.add(alias));
          }
        }
      }
      // Get current room context
      const currentRoom = this.world.rooms.get(this.state.currentRoom);
      if (currentRoom) {
        // Room exit completions
        if (currentRoom.exits) {
          Object.keys(currentRoom.exits).forEach(exit => completions.add(exit));
        }
        // Item completions in room
        if (currentRoom.items) {
          currentRoom.items.forEach(itemId => {
            const item = this.world.items.get(itemId);
            if (item) {
              completions.add(item.name.toLowerCase());
              if (item.aliases) {
                item.aliases.forEach(alias => completions.add(alias.toLowerCase()));
              }
            }
          });
        }
        // Character completions in room
        if (currentRoom.characters) {
          currentRoom.characters.forEach(charId => {
            const character = this.world.characters.get(charId);
            if (character) {
              completions.add(character.name.toLowerCase());
              if (character.aliases) {
                character.aliases.forEach(alias => completions.add(alias.toLowerCase()));
              }
              // Add genre pronouns if only one character
              if (currentRoom.characters.length === 1 && character.genre) {
                if (character.genre === 'female') {
                  completions.add('her');
                  completions.add('she');
                } else if (character.genre === 'male') {
                  completions.add('him');
                  completions.add('he');
                }
              }
            }
          });
        }
      }
      // Inventory item completions
      this.state.inventory.forEach(itemId => {
        const item = this.world.items.get(itemId);
        if (item) {
          completions.add(item.name.toLowerCase());
          if (item.aliases) {
            item.aliases.forEach(alias => completions.add(alias.toLowerCase()));
          }
        }
      });
      // Topic completions for "talk about" commands
      if (partCount >= 3 && parts[0] === 'talk' && currentRoom && currentRoom.characters) {
        const characterName = parts[1].toLowerCase();
        // Find the character
        for (const charId of currentRoom.characters) {
          const character = this.world.characters.get(charId);
          if (character && (
            character.name.toLowerCase().includes(characterName) ||
            (character.aliases && character.aliases.some(alias => 
              alias.toLowerCase().includes(characterName))
            )
          )) {
            // Add all topics for this character
            if (character.topics) {
              Object.keys(character.topics).forEach(topic => completions.add(topic));
              Object.values(character.topics).forEach(topicData => {
                if (topicData.aliases) {
                  topicData.aliases.forEach(alias => completions.add(alias));
                }
              });
            }
            break;
          }
        }
      }
      // Direction shortcuts for "go" command
      if (parts[0] === 'go' && partCount === 2) {
        const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 
                           'southeast', 'southwest', 'up', 'down', 'in', 'out'];
        const shortDirs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'u', 'd', 'i', 'o'];
        directions.forEach(dir => completions.add(dir));
        shortDirs.forEach(dir => completions.add(dir));
      }
      // Save slot completions for save/load commands
      if ((parts[0] === 'save' || parts[0] === 'load' || parts[0] === 'delete') && partCount === 2) {
        completions.add('default');
        completions.add('autosave');
        completions.add('slot1');
        completions.add('slot2');
        completions.add('slot3');
      }
      return Array.from(completions).sort();
    }
    findCommonPrefix(strings) {
      if (strings.length === 0) return "";
      let prefix = strings[0];
      for (let i = 1; i < strings.length; i++) {
        while (strings[i].indexOf(prefix) !== 0) {
          prefix = prefix.substring(0, prefix.length - 1);
          if (prefix === "") return "";
        }
      }
      return prefix;
    }
    processOutputQueue() {
      if (this.outputQueue.length === 0) {
        this.queueIsRunning = false;
        if (this.env === "node") {
          this.rl.prompt();
        }
        return;
      }
      this.queueIsRunning = true;
      const nextItem = this.outputQueue.shift();
      if (this.config.disableTextAnimation || nextItem.instant) {
        if (nextItem.img) {
          this.printImageInstantly(nextItem.text, nextItem.callback);
        } else {
          this.printInstantly(nextItem.text, nextItem.callback);
        }
      } else {
        if (nextItem.img) {
          this.animateImage(nextItem.text, nextItem.callback);
          this.animationState.isAnimating = true;
        } else {
          this.animateText(nextItem.text, nextItem.callback);
          this.animationState.isAnimating = true;
        }
      }
    }
    // Output methods
    print(text, instant = false, img = false) {
      return new Promise((resolve, reject) => {
        this.outputQueue.push({
          text,
          instant,
          img,
          callback: () => resolve()
        });
        // Start loop if paused
        if (!this.queueIsRunning) {
          this.processOutputQueue();
        }
      });
    }
    printLine(text = '', instant = false) {
      return this.print(text + (this.env === 'browser' ? '{{instant}}<br>{{/instant}}' : '\n'), instant);
    }
    printImg(text, instant = false) {
      return this.print(text, instant, true);
    }
    clearScreen() {
      if (this.env === "browser") {
        this.outputElement.innerHTML = "";
      } else {
        process.stdout.write("\x1B[2J\x1B[0f");
      }
    }
    animateText(text, callback) {
      let index = 0;
      let instantMode = false;
      let outputText = '';
      let tagStack = [];
      if (this.env === 'browser') {
        const div = document.createElement('div');
        this.outputElement.appendChild(div);
        this.animationState.currentAnimation = setInterval(() => {
          if (index >= text.length) {
            clearInterval(this.animationState.currentAnimation);
            this.animationState.currentAnimation = null;
            this.animationState.isAnimating = false;
            if (callback) callback();
            this.processOutputQueue();
            return;
          }
          // Check for opening instant tag
          if (text.substring(index, index + 11) === '{{instant}}') {
            instantMode = true;
            index += 11;
            tagStack.push('instant');
            return;
          }
          // Check for closing instant tag
          if (text.substring(index, index + 13) === '{{/instant}}') {
            if (tagStack[tagStack.length - 1] === 'instant') {
              tagStack.pop();
              instantMode = tagStack.includes('instant');
            }
            index += 13;
            return;
          }
          // Check for other formatting tags
          if (text.charAt(index) === '{' && text.charAt(index + 1) === '{') {
            const tagEnd = text.indexOf('}}', index);
            if (tagEnd !== -1) {
              const tag = text.substring(index + 2, tagEnd).trim().toLowerCase();
              // Handle formatting tags
              outputText += this.processSingleTag(tag);
              index = tagEnd + 2;
              div.innerHTML = outputText;
              return;
            }
          }
          if (instantMode) {
            // Find the next closing instant tag or end of text
            const closingIndex = text.indexOf('{{/instant}}', index);
            if (closingIndex === -1) {
              // No closing tag found, add all remaining text
              outputText += text.substring(index);
              div.innerHTML = outputText;
              index = text.length;
            } else {
              // Add text until closing tag
              outputText += text.substring(index, closingIndex);
              div.innerHTML = outputText;
              index = closingIndex;
            }
          } else {
            outputText += text.charAt(index);
            div.innerHTML = outputText;
            index++;
          }
          this.outputElement.scrollTop = this.outputElement.scrollHeight;
        }, this.config.typingSpeed);
      } else {
        this.animationState.currentAnimation = setInterval(() => {
          if (index >= text.length) {
            clearInterval(this.animationState.currentAnimation);
            this.animationState.currentAnimation = null;
            this.animationState.isAnimating = false;
            if (callback) callback();
            this.processOutputQueue();
            return;
          }
          // Check for opening instant tag
          if (text.substring(index, index + 11) === '{{instant}}') {
            instantMode = true;
            index += 11;
            tagStack.push('instant');
            return;
          }
          // Check for closing instant tag
          if (text.substring(index, index + 13) === '{{/instant}}') {
            if (tagStack[tagStack.length - 1] === 'instant') {
              tagStack.pop();
              instantMode = tagStack.includes('instant');
            }
            index += 13;
            return;
          }
          // Check for other formatting tags
          if (text.charAt(index) === '{' && text.charAt(index + 1) === '{') {
            const tagEnd = text.indexOf('}}', index);
            if (tagEnd !== -1) {
              const tag = text.substring(index + 2, tagEnd).trim().toLowerCase();
              // Handle formatting tags
              process.stdout.write(this.processSingleTag(tag));
              index = tagEnd + 2;
              return;
            }
          }
          if (instantMode) {
            // Find the next closing instant tag or end of text
            const closingIndex = text.indexOf('{{/instant}}', index);
            if (closingIndex === -1) {
              // No closing tag found, add all remaining text
              process.stdout.write(text.substring(index));
              index = text.length;
            } else {
              // Add text until closing tag
              process.stdout.write(text.substring(index, closingIndex));
              index = closingIndex;
            }
          } else {
            process.stdout.write(text.charAt(index));
            index++;
          }
        }, this.config.typingSpeed);
      }
    }
    printInstantly(text, callback, processQueue = true) {
      const formattedText = this.parseFormatting(text);
      if (this.env === 'browser') {
        const div = document.createElement('div');
        div.innerHTML = formattedText;
        this.outputElement.appendChild(div);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
      } else {
        process.stdout.write(formattedText);
      }
      callback && callback();
      processQueue && this.processOutputQueue();
    }
    updateLastLine(text) {
      if (this.env === 'browser') {
        const lines = this.outputElement.querySelectorAll('div');
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          lastLine.innerHTML = this.parseFormatting(text);
        } else {
          this.print(text, true);
        }
      } else {
        // Move cursor up one line and clear line
        process.stdout.write('\x1B[1A\x1B[2K');
        process.stdout.write(this.parseFormatting(text) + '\n');
      }
    }
    printTextLineByLine(text, callback) {
      const lines = text.split('\n');
      let index = 0;
      const printNextLine = () => {
        if (index >= lines.length) {
          callback && callback();
        } else {
          const newLine = this.env == "node" ? "\n" : "";
          this.printInstantly(
            lines[index] + newLine,
            () => setTimeout(() => printNextLine(), this.config.typingSpeed),
            false
          );
        }
        index++;
      };
      printNextLine();
    }
    animateImage(text, callback) {
      const isAnimation = Array.isArray(text);
      const firstFrame = isAnimation ? text[0] : text;
      const animationFrames = isAnimation ? text : [text];
      if (this.env === 'browser') {
        const animationId = Utils.uuid();
        // Print the first frame
        this.printTextLineByLine(firstFrame, () => {
          if (!isAnimation) {
            // Single image, not an animation
            callback && callback();
            this.animationState.isAnimating = false;
            this.processOutputQueue();
            return;
          }
          // Animation setup
          let currentFrame = 0;
          let animationLines = firstFrame.split('\n');
          const totalLines = animationLines.length;
          // Store animation state
          this.animationFrames.set(animationId, {
            frames: animationFrames,
            currentFrame: 0,
            totalLines: totalLines,
            elementIds: [],
            callback: callback
          });
          // Track which DOM elements belong to this animation
          const outputLines = this.outputElement.querySelectorAll('div');
          const startIndex = Math.max(0, outputLines.length - totalLines);
          for (let i = startIndex; i < outputLines.length; i++) {
            outputLines[i].classList.add(`lore-animation-${animationId}`);
            this.animationFrames.get(animationId).elementIds.push(i);
          }
          // Start animation loop
          const animate = () => {
            currentFrame = (currentFrame + 1) % animationFrames.length;
            this.updateAnimation(animationId, currentFrame);
            this.animationFrames.get(animationId).currentFrame = currentFrame;
          };
          // Start animation interval
          const intervalId = setInterval(animate, 200); // 5 FPS by default
          this.animationIntervals.set(animationId, intervalId);
          // Store callback to call when animation should stop
          this.animationFrames.get(animationId).callback = callback;
          // Continue queue
          this.processOutputQueue();
        });
      } else {
        this.printTextLineByLine(firstFrame, () => this.processOutputQueue());
      }
    }
    printImageInstantly(text, callback) {
      const isAnimation = Array.isArray(text);
      const firstFrame = isAnimation ? text[0] : text;
      const newLine = this.env == "node" ? "\n" : "";
      this.printInstantly(newLine + firstFrame + newLine, () => this.processOutputQueue());
    }
    updateAnimation(animationId, frameIndex) {
      if (!this.animationFrames.has(animationId)) return;
      const animation = this.animationFrames.get(animationId);
      const frame = animation.frames[frameIndex];
      const frameLines = frame.split('\n');
      // Get all elements that are part of this animation
      const elements = this.outputElement.querySelectorAll(`.lore-animation-${animationId}`);
      // Update each line
      for (let i = 0; i < Math.min(elements.length, frameLines.length); i++) {
        elements[i].textContent = frameLines[i];
      }
      // If the new frame has more lines, add them
      if (frameLines.length > elements.length) {
        for (let i = elements.length; i < frameLines.length; i++) {
          const newElement = document.createElement('div');
          newElement.textContent = frameLines[i];
          newElement.classList.add(`lore-animation-${animationId}`);
          this.outputElement.appendChild(newElement);
          animation.elementIds.push(-1); // Mark as new element
        }
      }
      // If the new frame has fewer lines, hide the extra ones
      for (let i = frameLines.length; i < elements.length; i++) {
        elements[i].textContent = '';
      }
    }
    stopAnimation(animationId) {
      if (this.animationIntervals.has(animationId)) {
        clearInterval(this.animationIntervals.get(animationId));
        this.animationIntervals.delete(animationId);
      }
      if (this.animationFrames.has(animationId)) {
        const animation = this.animationFrames.get(animationId);
        // Call the callback if it exists
        if (animation.callback) {
          animation.callback();
        }
        this.animationFrames.delete(animationId);
      }
    }
    skipAnimation() {
      // Handle text animations
      if (this.animationState.currentAnimation && this.animationState.isAnimating) {
        clearInterval(this.animationState.currentAnimation);
        this.animationState.currentAnimation = null;
        this.animationState.isAnimating = false;
        // Process all remaining animation items instantly
        while (this.outputQueue.length > 0) {
          const animationItem = this.outputQueue.shift();
          const formattedText = this.parseFormatting(typeof animationItem.text == "string" ? animationItem.text : animationItem.text[0]);
          if (this.env === 'browser') {
            const div = document.createElement('div');
            div.innerHTML = formattedText;
            this.outputElement.appendChild(div);
          } else {
            process.stdout.write(formattedText);
          }
          if (animationItem.callback) {
            animationItem.callback();
          }
        }
      }
      // Handle image animations
      if (this.animationIntervals.size > 0) {
        // Stop all image animations
        for (const [animationId, intervalId] of this.animationIntervals.entries()) {
          clearInterval(intervalId);
          // Show the first frame of the animation
          const animation = this.animationFrames.get(animationId);
          if (animation) {
            const firstFrame = animation.frames[0];
            if (this.env === 'browser') {
              // Replace animation with first frame
              const elements = this.outputElement.querySelectorAll(`.lore-animation-${animationId}`);
              const frameLines = firstFrame.split('\n');
              for (let i = 0; i < Math.min(elements.length, frameLines.length); i++) {
                elements[i].textContent = frameLines[i];
              }
              // Remove any extra lines
              for (let i = frameLines.length; i < elements.length; i++) {
                elements[i].remove();
              }
            } else {
              // In Node.js, we need to rewrite the animation area with the first frame
              const frameLines = firstFrame.split('\n');
              // Move cursor up to the start of the animation
              process.stdout.write(`\x1B[${animation.totalLines}A`);
              // Print the first frame
              for (let i = 0; i < frameLines.length; i++) {
                process.stdout.write(`\x1B[2K${frameLines[i]}\n`);
              }
              // Clear any extra lines
              for (let i = frameLines.length; i < animation.totalLines; i++) {
                process.stdout.write(`\x1B[2K\n`);
              }
            }
            // Call the callback if it exists
            if (animation.callback) {
              animation.callback();
            }
          }
        }
        // Clear all animation state
        this.animationIntervals.clear();
        this.animationFrames.clear();
      }
      // Scroll to bottom
      if (this.env === "browser") {
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
      }
      // Ensure animation state is reset
      this.animationState.isAnimating = false;
      this.queueIsRunning = false;
    }
    updatePrompt(newPrompt) {
      if (this.env === "browser") {
        this.config.prompt = newPrompt;
        this.promptElement.innerHTML = this.parseFormatting(newPrompt);
      } else {
        this.config.prompt = newPrompt;
        this.rl.setPrompt(this.parseFormatting(newPrompt));
        this.rl.prompt();
      }
    }
    // Game state management
    start(startRoomId) {
      this.startGame(this.startRoomId || this.state.currentRoom);
    }
    startGame(startRoomId) {
      this.isRunning = true;
      this.state.currentRoom = startRoomId;
      this.look();
      if (this.env === "node") {
        this.rl.prompt();
      } else {
        this.inputElement.focus();
      }
    }
    restartGame() {
      this.state = {
        currentRoom: null,
        inventory: [],
        flags: {},
        variables: {},
        history: [],
        gameTime: 0
      };
      this.clearScreen();
      this.printLine("Game restarted.");
      if (this.world.rooms.size > 0) {
        const firstRoom = Array.from(this.world.rooms.keys())[0];
        this.startGame(firstRoom);
      }
    }
    // Room navigation
    move(direction) {
      const currentRoom = this.world.rooms.get(this.state.currentRoom);
      if (!currentRoom || !currentRoom.exits || !currentRoom.exits[direction]) {
        this.printLine(`You can't go that way.`);
        return false;
      }
      const nextRoomId = currentRoom.exits[direction];
      this.enterRoom(nextRoomId);
      return true;
    }
    enterRoom(roomId) {
      const nextRoom = this.world.rooms.get(roomId);
      if (!nextRoom) {
        this.printLine(`The path leads nowhere.`);
        return false;
      }
      // Check if room is locked
      if (nextRoom.condition && !nextRoom.condition(this.state)) {
        this.printLine(nextRoom.blockedMessage || `You can't go that way right now.`);
        return false;
      }
      this.state.currentRoom = nextRoom.id;
      this.state.gameTime++;
      // Call onEnter callback if defined
      if (nextRoom.onEnter) {
        nextRoom.onEnter(this.state, this);
      }
      this.look(true);
      return true;
    }
    look(silent = false) {
      const room = this.world.rooms.get(this.state.currentRoom);
      if (!room) {
        this.printLine("You are in the void.");
        return;
      }
      // Display room name and description
      if (room.name && room.name.length) {
        this.printLine(room.name);
        this.printLine("");
      }
      // Display room image if available
      if (room.image) {
        this.printImg(room.image);
        this.printLine("");
      }
      if (room.description && room.description.length) {
        this.printLine(room.description);
        this.printLine("");
      }
      // Call onLook
      if (!silent && room.onLook) {
        room.onLook(this.state, this);
      }
      // Display items in room
      if (room.items && room.items.length > 0) {
        const itemList = room.items
          .map(id => {
            const item = this.world.items.get(id);
            return item ? item.name : "unknown item";
          })
          .join(", ");
        this.printLine(`You see: ${itemList}`);
      }
      // Display characters in room
      if (room.characters && room.characters.length > 0) {
        const charList = room.characters
          .map(id => {
            const character = this.world.characters.get(id);
            return character ? character.name : "unknown character";
          })
          .join(", ");
        this.printLine(`You see: ${charList}`);
      }
      // Show tutorials
      if (room.tutorial || room.tutorials) {
        this.printLine("");
        if (typeof room.tutorial === "string") {
          this.printTutorial(room.tutorial);
        } else if (typeof room.tutorial === "object" || typeof room.tutorials === "object") {
          (room.tutorial || room.tutorials).forEach(command => {
            this.printTutorial(command);
          });
        }
        if (!room.keepTutorials) {
          delete room.tutorial;
          delete room.tutorials;
        }
      }
    }
    printRoomExits(room) {
      if (!room) return false;
      if (room.exits) {
        let exitList = "";
        Object.keys(room.exits).forEach(exit => exitList += ` - ${exit}{{n}}`);
        this.printLine(`Where would you like to go?\n${exitList}`);
      } else {
        this.printLine("You don't see how to exit");
      }
      return true;
    }
    printTutorial(key) {
      const command = this.world.commands.get(key);
      if (!command || !command.purpose) return;
      this.printLine(`Type {{bold}}${command.name}{{font_reset}} to ${command.purpose}.`);
    }
    stopAnimation(animationId) {
      if (this.animationIntervals.has(animationId)) {
        clearInterval(this.animationIntervals.get(animationId));
        this.animationIntervals.delete(animationId);
      }
      if (this.animationFrames.has(animationId)) {
        this.animationFrames.delete(animationId);
      }
      // Clear the animation from output in browser
      if (this.env === "browser") {
        const elements = this.outputElement.querySelectorAll(`.lore-animation-${animationId}`);
        elements.forEach(el => el.remove());
      }
    }
    stopAllAnimations() {
      for (const id of this.animationIntervals.keys()) {
        this.stopAnimation(id);
      }
    }
    // Room locking system
    lockRoom(roomId, condition, blockedMessage = "The way is blocked.") {
      const room = this.world.rooms.get(roomId);
      if (room) {
        room.condition = condition;
        room.blockedMessage = blockedMessage;
        return true;
      }
      return false;
    }
    unlockRoom(roomId) {
      const room = this.world.rooms.get(roomId);
      if (room) {
        room.condition = null;
        room.blockedMessage = null;
        return true;
      }
      return false;
    }
    isRoomLocked(roomId) {
      const room = this.world.rooms.get(roomId);
      return room && room.condition && !room.condition(this.state);
    }
    // Item management and interaction
    takeItem(itemId) {
      const room = this.world.rooms.get(this.state.currentRoom);
      if (!room || !room.items || !room.items.includes(itemId)) {
        this.printLine("You don't see that here.");
        return false;
      }
      const item = this.world.items.get(itemId);
      if (!item) {
        this.printLine("You can't take that.");
        return false;
      }
      if (!item.takeable) {
        this.printLine(`You can't take the ${item.shortName || item.name}.`);
        return false;
      }
      // Remove from room, add to inventory
      room.items = room.items.filter(id => id !== itemId);
      this.state.inventory.push(itemId);
      this.printLine(`You take the ${item.shortName || item.name}.`);
      return true;
    }
    dropItem(itemId) {
      const itemIndex = this.state.inventory.indexOf(itemId);
      if (itemIndex === -1) {
        this.printLine("You don't have that item.");
        return false;
      }
      const item = this.world.items.get(itemId);
      if (!item) {
        this.printLine("You can't drop that.");
        return false;
      }
      const room = this.world.rooms.get(this.state.currentRoom);
      if (!room) {
        this.printLine("You can't drop items here.");
        return false;
      }
      // Remove from inventory, add to room
      this.state.inventory.splice(itemIndex, 1);
      if (!room.items) room.items = [];
      room.items.push(itemId);
      this.printLine(`You drop the ${item.shortName || item.name}.`);
      return true;
    }
    useItem(itemId, targetId = null) {
      const itemIndex = this.state.inventory.indexOf(itemId);
      if (itemIndex === -1) {
        this.printLine("You don't have that item.");
        return false;
      }
      const item = this.world.items.get(itemId);
      if (!item) {
        this.printLine("You can't use that.");
        return false;
      }
      // If no target specified, use the item on itself
      if (!targetId) {
        if (item.use) {
          return item.use(this.state, this);
        } else {
          this.printLine(`You can't use the ${item.shortName || item.name} that way.`);
          return false;
        }
      }
      // Check if target is in inventory
      const targetInInventory = this.state.inventory.includes(targetId);
      // Check if target is in the room
      const room = this.world.rooms.get(this.state.currentRoom);
      const targetInRoom = room && room.items && room.items.includes(targetId);
      // Check if target is a character in the room
      const targetIsCharacter = room && room.characters && room.characters.includes(targetId);
      if (!targetInInventory && !targetInRoom && !targetIsCharacter) {
        this.printLine("You don't see that here.");
        return false;
      }
      let target;
      if (targetIsCharacter) {
        target = this.world.characters.get(targetId);
      } else {
        target = this.world.items.get(targetId);
      }
      if (!target) {
        this.printLine("You can't use that.");
        return false;
      }
      // Check if item has a specific use for this target
      if (item.useOn && item.useOn[targetId]) {
        return item.useOn[targetId](this.state, this);
      }
      // Check if target has a general use handler
      if (target.useWith && target.useWith[itemId]) {
        return target.useWith[itemId](this.state, this);
      }
      this.printLine(`Using the ${item.shortName || item.name} on the ${item.shortName || target.name} doesn't seem to do anything.`);
      return false;
    }
    lookAtItem(itemName) {
      const room = this.world.rooms.get(this.state.currentRoom);
      if (!room || !room.items) {
        this.printLine("You don't see that here.");
        return false;
      }
      // Find item by name or alias
      let item = null;
      for (const itemId of room.items) {
        const currentItem = this.world.items.get(itemId);
        if (currentItem && (
          currentItem.name.toLowerCase().includes(itemName) ||
          (currentItem.aliases && currentItem.aliases.some(alias => 
            alias.toLowerCase().includes(itemName))
          )
        )) {
          item = currentItem;
          break;
        }
      }
      if (!item) {
        this.printLine("You don't see that here.");
        return false;
      }
      if (item.look) {
        item.look(this.state, this);
      } else if (item.description) {
        this.printLine(item.description);
      } else {
        this.printLine(`It's a ${item.shortName || item.name}.`);
      }
      return true;
    }
    useUntakeableItem(itemName) {
      const room = this.world.rooms.get(this.state.currentRoom);
      if (!room || !room.items) {
        this.printLine("You don't see that here.");
        return false;
      }
      // Find item by name or alias
      let item = null;
      for (const itemId of room.items) {
        const currentItem = this.world.items.get(itemId);
        if (currentItem && (
          currentItem.name.toLowerCase().includes(itemName) ||
          (currentItem.aliases && currentItem.aliases.some(alias => 
            alias.toLowerCase().includes(itemName))
          )
        )) {
          item = currentItem;
          break;
        }
      }
      if (!item) {
        this.printLine("You don't see that here.");
        return false;
      }
      if (item.use) {
        return item.use(this.state, this);
      } else {
        this.printLine(`You're not sure how to use the ${item.shortName || item.name}.`);
        return false;
      }
    }
    // Dialog functions
    async confirm(prompt) {
      if (this.env === 'browser') {
        // Browser implementation - terminal style
        this.printLine(prompt);
        this.printLine('1. Yes');
        this.printLine('2. No');
        return new Promise((resolve) => {
          const handleInput = (input) => {
            const choice = input.trim().toLowerCase();
            if (choice === '1' || choice === 'yes' || choice === 'y') {
              resolve(true);
            } else if (choice === '2' || choice === 'no' || choice === 'n') {
              resolve(false);
            } else {
              this.updateLastLine('Please enter 1 for Yes or 2 for No: ');
              this.inputElement.addEventListener('keydown', handleInput, { once: true });
            }
          };
          this.updateLastLine('Select option (1-2): ');
          this.inputElement.addEventListener('keydown', handleInput, { once: true });
        });
      } else {
        // Node.js implementation
        this.printLine(prompt);
        this.printLine('1. Yes');
        this.printLine('2. No');
        return new Promise((resolve) => {
          this.rl.question('Select option (1-2): ', (answer) => {
            const choice = answer.trim().toLowerCase();
            if (choice === '1' || choice === 'yes' || choice === 'y') {
              resolve(true);
            } else if (choice === '2' || choice === 'no' || choice === 'n') {
              resolve(false);
            } else {
              this.printLine('Invalid selection. Please try again.');
              resolve(this.confirm(prompt));
            }
          });
        });
      }
    }
    async selectFromList(prompt, options) {
      if (this.env === 'browser') {
        // Browser implementation - terminal style
        this.printLine(prompt);
        options.forEach((option, index) => {
          this.printLine(`${index + 1}. ${option}`);
        });
        this.printLine(`${options.length + 1}. Cancel`);
        return new Promise((resolve) => {
          const handleInput = (input) => {
            const choice = parseInt(input.trim(), 10);
            if (!isNaN(choice) && choice >= 1 && choice <= options.length + 1) {
              resolve(choice === options.length + 1 ? -1 : choice - 1);
            } else {
              this.updateLastLine(`Please enter a number between 1 and ${options.length + 1}: `);
              this.inputElement.addEventListener('keydown', handleInput, { once: true });
            }
          };
          this.updateLastLine(`Select option (1-${options.length + 1}): `);
          this.inputElement.addEventListener('keydown', handleInput, { once: true });
        });
      } else {
        // Node.js implementation
        this.printLine(prompt);
        options.forEach((option, index) => {
          this.printLine(`${index + 1}. ${option}`);
        });
        this.printLine(`${options.length + 1}. Cancel`);
        return new Promise((resolve) => {
          this.rl.question(`Select option (1-${options.length + 1}): `, (answer) => {
            const choice = parseInt(answer.trim(), 10);
            if (!isNaN(choice) && choice >= 1 && choice <= options.length + 1) {
              resolve(choice === options.length + 1 ? -1 : choice - 1);
            } else {
              this.printLine('Invalid selection. Please try again.');
              resolve(this.selectFromList(prompt, options));
            }
          });
        });
      }
    }
    // Save/load system
    saveGame(slot = "default", silent = false) {
      const saveData = {
        state: { ...this.state },
        timestamp: Date.now(),
        slot: slot
      };
      if (this.env === "browser") {
        const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        saves[slot] = saveData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
        !silent && this.printLine(`{{green}}Game saved in slot: ${slot}{{color_reset}}`);
      } else {
        const saveDir = this.path.join(__dirname, "saves");
        if (!this.fs.existsSync(saveDir)) {
          this.fs.mkdirSync(saveDir, { recursive: true });
        }
        const savePath = this.path.join(saveDir, `save_${slot}.json`);
        this.fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));
        !silent && this.printLine(`{{green}}Game saved in slot: ${slot}{{color_reset}}`);
      }
    }
    loadGame(slot = "default") {
      try {
        let saveData;
        if (this.env === "browser") {
          const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
          saveData = saves[slot];
        } else {
          const savePath = this.path.join(__dirname, "saves", `save_${slot}.json`);
          if (!this.fs.existsSync(savePath)) {
            this.printLine(`No save file found in slot: ${slot}`);
            return false;
          }
          saveData = JSON.parse(this.fs.readFileSync(savePath, "utf8"));
        }
        if (!saveData) {
          this.printLine(`No save file found in slot: ${slot}`);
          return false;
        }
        this.state = saveData.state;
        this.printLine(`Game loaded from slot: ${slot}`);
        this.look();
        return true;
      } catch (error) {
        this.printLine(`Error loading game: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
        return false;
      }
    }
    deleteSave(slot = "default") {
      try {
        if (this.env === "browser") {
          const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
          if (saves[slot]) {
            delete saves[slot];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
            this.printLine(`Save slot ${slot} deleted.`);
            return true;
          }
        } else {
          const savePath = this.path.join(__dirname, "saves", `save_${slot}.json`);
          if (this.fs.existsSync(savePath)) {
            this.fs.unlinkSync(savePath);
            this.printLine(`Save slot ${slot} deleted.`);
            return true;
          }
        }
        this.printLine(`No save file found in slot: ${slot}`);
        return false;
      } catch (error) {
        this.printLine(`Error deleting save: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
        return false;
      }
    }
    listSaves() {
      try {
        let saves = {};
        if (this.env === "browser") {
          saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        } else {
          const saveDir = this.path.join(__dirname, "saves");
          if (this.fs.existsSync(saveDir)) {
            const files = this.fs.readdirSync(saveDir);
            files.forEach(file => {
              if (file.startsWith("save_") && file.endsWith(".json")) {
                const slot = file.replace("save_", "").replace(".json", "");
                const savePath = this.path.join(saveDir, file);
                const saveData = JSON.parse(this.fs.readFileSync(savePath, "utf8"));
                saves[slot] = saveData;
              }
            });
          }
        }
        if (Object.keys(saves).length === 0) {
          this.printLine("No save files found.");
          return;
        }
        this.printLine("Available saves:");
        for (const [slot, data] of Object.entries(saves)) {
          const date = new Date(data.timestamp);
          this.printLine(`- ${slot}: ${date.toLocaleString()}`);
        }
      } catch (error) {
        this.printLine(`Error listing saves: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
      }
    }
    // World building methods
    addRoom(room) {
      if (!room.id) {
        room.id = Utils.uuid();
      }
      this.world.rooms.set(room.id, room);
      return room.id;
    }
    addItem(item) {
      if (!item.id) {
        item.id = Utils.uuid();
      }
      item.use = Utils.deserializeFunction(item.use);
      this.world.items.set(item.id, item);
      return item.id;
    }
    addCharacter(character) {
      if (!character.id) {
        character.id = Utils.uuid();
      }
      this.world.characters.set(character.id, character);
      return character.id;
    }
    addEvent(event) {
      if (!event.id) {
        event.id = Utils.uuid();
      }
      this.world.events.set(event.id, event);
      return event.id;
    }
    // Plugin system
    async loadPlugin(plugin) {
      try {
        // Prepare module
        plugin = await this.prepareModule(plugin);
        // Register plugin
        if (plugin.id && !this.plugins.has(plugin.id)) {
          this.plugins.set(plugin.id, plugin);
          // Apply plugin components
          if (plugin.commands) {
            for (const command of plugin.commands) {
              this.registerCommand(command);
            }
          }
          if (plugin.rooms) {
            for (const room of plugin.rooms) {
              this.addRoom(room);
            }
          }
          if (plugin.items) {
            for (const item of plugin.items) {
              this.addItem(item);
            }
          }
          if (plugin.characters) {
            for (const character of plugin.characters) {
              this.addCharacter(character);
            }
          }
          if (plugin.events) {
            for (const event of plugin.events) {
              this.addEvent(event);
            }
          }
          if (plugin.keybindings) {
            for (const [key, binding] of Object.entries(plugin.keybindings)) {
              this.registerKeybinding(key, binding);
            }
          }
          if (plugin.init) {
            plugin.init(this);
          }
          this.printLine(`Plugin loaded: ${plugin.name || plugin.id}`);
          return true;
        } else {
          this.printLine("Invalid plugin format: missing id");
          return false;
        }
      } catch (error) {
        this.printLine(`Error loading plugin: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
        return false;
      }
    }
    unloadPlugin(pluginId) {
      if (this.plugins.has(pluginId)) {
        const plugin = this.plugins.get(pluginId);
        // Remove plugin components
        if (plugin.commands) {
          for (const name of Object.keys(plugin.commands)) {
            this.world.commands.delete(name);
          }
        }
        if (plugin.rooms) {
          for (const room of plugin.rooms) {
            this.world.rooms.delete(room.id);
          }
        }
        if (plugin.items) {
          for (const item of plugin.items) {
            this.world.items.delete(item.id);
          }
        }
        if (plugin.characters) {
          for (const character of plugin.characters) {
            this.world.characters.delete(character.id);
          }
        }
        if (plugin.events) {
          for (const event of plugin.events) {
            this.world.events.delete(event.id);
          }
        }
        if (plugin.keybindings) {
          for (const key of Object.keys(plugin.keybindings)) {
            this.world.keybindings.delete(key);
          }
        }
        this.plugins.delete(pluginId);
        this.printLine(`Plugin unloaded: ${pluginId}`);
        return true;
      } else {
        this.printLine(`Plugin not found: ${pluginId}`);
        return false;
      }
    }
    // Theme system
    async loadTheme(theme) {
      try {
        theme = await this.prepareModule(theme);
        // Apply theme
        this.theme = { ...DEFAULT_THEME, ...theme };
        if (this.env === "browser") {
          // Update CSS variables
          for (const [property, value] of Object.entries(this.theme)) {
            document.documentElement.style.setProperty(property, value);
          }
          // Update terminal styles
          this.terminalElement.style.backgroundColor = this.theme["--lore-bg-color"];
          this.terminalElement.style.color = this.theme["--lore-text-color"];
          this.terminalElement.style.fontFamily = this.theme["--lore-font-family"];
          this.terminalElement.style.fontSize = this.theme["--lore-font-size"];
          this.promptElement.style.color = this.theme["--lore-prompt-color"];
          this.inputElement.style.color = this.theme["--lore-input-color"];
          if (this.theme["--lore-prompt-content"]) {
            this.updatePrompt(this.theme["--lore-prompt-content"]);
          }
        } else {
          if (this.theme["--lore-prompt-content"]) {
            this.updatePrompt(this.theme["--lore-prompt-content"]);
          }
        }
        return true;
      } catch (error) {
        this.printLine(`Error loading theme: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
        return false;
      }
    }
    // Prepare modules to be used
    async prepareModule(content) {
      // If content is a URL, fetch it
      if (typeof content === "string" && Utils.isURL(content)) {
        if (content.endsWith(".js")) {
          try {
            if (this.env === "browser") {
              content = await Utils.loadModule(content);
            } else {
              content = require(content);
            }
          } catch (error) {
            this.printLine(`{{red}}Couldn't prepare module\n${error.message}`);
            return {};
          }
        } else {
          this.printLine(`{{red}}Module loaded from URL must be a JavaScript (.js) file{{color_reset}}`);
          return {};
        }
      }
      if (typeof content === "string") {
        content = JSON.parse(novel);
      }
      return content;
    }
    // Command registration
    printHelp(commandName) {
      if (!commandName) {
        this.printLine("{{bold}}Available commands:{{font_reset}}");
        const commands = Array.from(this.world.commands)
          .map(command => command[1])
          .sort((a, b) => a.weight - b.weight)
          .filter(command => command.help && command.weight != -1);
        commands.forEach(command => {
          const name = command.display || command.name;
          const aliases = command.aliases && command.aliases.length ? ", " + command.aliases.join(', ') : "";
          const help = command.help;
          this.printLine(`  {{green}}${name}{{color_reset}}{{green}}${aliases}{{color_reset}} - ${help}`);
        });
      } else {
        if (!this.world.commands.has(commandName) && this.world.aliases.has(commandName)) {
          commandName = this.world.aliases.get(commandName);
        }
        const command = this.world.commands.get(commandName);
        if (!command) {
          this.printLine("");
          this.printLine(`Unknown command: ${commandName}. Type 'help' for available commands.`);
        } else {
          const aliases = command.aliases && command.aliases.length ? ", " + command.aliases.join(', ') : "";
          this.printLine(`{{green}}${command.name}${aliases}{{color_reset}`);
          this.printLine("Usage:");
          this.printLine(`{{green}}${command.display || command.name}{{color_reset}}`);
          if (command.purpose) {
            this.printLine(`Use it to ${command.purpose}.`);
          }
        }
      }
    }
    registerCommand(command) {
      if (!command || !command.name) return;
      this.world.commands.set(command.name.toLowerCase(), {
        name: "foo",
        aliases: [],
        fn: () => {},
        help: "",
        weight: null,
        purpose: null,
        ...command
      });
      if (command.aliases) {
        command.aliases.forEach(alias => {
          this.world.aliases.set(alias, command.name.toLowerCase());
        })
      }
    }
    registerKeybinding(key, action) {
      this.world.keybindings.set(key, action);
    }
    registerDefaultCommands() {
      // Help command
      this.registerCommand({
        name: "help",
        aliases: ["h", "?"],
        fn: (args, engine) => engine.printHelp(args[0]),
        help: "Show this help",
        purpose: "see available commands",
        weight: 1000
      });
      // Look command
      this.registerCommand({
        name: "look",
        aliases: ["l", "see", "examine", "inspect"],
        fn: (args, engine) => {
          if (args.length === 0) {
            // Default look around behavior
            engine.look();
            return;
          }
          // Look at specific item
          const target = args.join(" ").toLowerCase();
          engine.lookAtItem(target);
        },
        help: "Look around or examine a specific item",
        purpose: "look around",
        weight: 1
      });
      // Movement commands
      this.registerCommand({
        name: "go",
        display: "go [dir]",
        fn: (args, engine) => {
          if (args.length === 0) {
            const currentRoom = engine.world.rooms.get(engine.state.currentRoom);
            if (!currentRoom || !currentRoom.exits || !JSON.stringify(currentRoom.exits) == "{}") {
              engine.printLine("Go where?");
            } else {
              engine.printRoomExits(currentRoom);
            }
            return;
          }
          engine.move(args[0]);
        },
        help: "Move in a direction",
        purpose: "move in a direction",
        weight: 2
      })
      // Direction shortcuts
      const directions = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", "up", "down", "in", "out"];
      const aliases = ["n", "s", "e", "w", "ne", "nw", "se", "sw", "u", "d", "i", "o"];
      for (let i = 0; i < directions.length; i++) {
        const dir = directions[i];
        const alias = aliases[i];
        this.registerCommand({
          name: dir,
          aliases: [alias],
          fn: (args, engine) => engine.move(dir),
          help: null,
          purpose: `go ${dir}`,
          weight: -1
        });
      }
      // Take command
      this.registerCommand({
        name: "take",
        display: "take [item]",
        fn: (args, engine) => {
          if (args.length === 0) {
            const room = engine.world.rooms.get(engine.state.currentRoom);
            if (!room || !room.items || room.items.length === 0) {
              engine.printLine("Take what? There's nothing here to take.");
              return;
            }
            engine.printLine("What would you like to take?");
            const itemList = room.items
              .map(id => {
                const item = engine.world.items.get(id);
                return item ? `- ${item.name}${item.aliases ? ` (also: ${item.aliases.join(', ')})` : ''}` : "unknown item";
              })
              .join("\n");
            engine.printLine(itemList);
            return;
          }
          const room = engine.world.rooms.get(engine.state.currentRoom);
          if (!room || !room.items) {
            engine.printLine("There's nothing to take here.");
            return;
          }
          // Find item by name or alias
          const itemName = args.join(" ").toLowerCase();
          let itemId = null;
          for (const id of room.items) {
            const item = engine.world.items.get(id);
            if (item) {
              // Check main name
              if (item.name.toLowerCase().includes(itemName)) {
                itemId = id;
                break;
              }
              // Check aliases
              if (item.aliases) {
                for (const alias of item.aliases) {
                  if (alias.toLowerCase().includes(itemName)) {
                    itemId = id;
                    break;
                  }
                }
              }
              if (itemId) break;
            }
          }
          if (itemId) {
            engine.takeItem(itemId);
          } else {
            engine.printLine("You don't see that here.");
          }
        },
        help: "Take an item",
        purpose: "take something",
        weight: 3
      });
      // Drop command
      this.registerCommand({
        name: "drop",
        display: "drop [item]",
        fn: (args, engine) => {
          if (args.length === 0) {
            engine.printLine("Drop what?");
            return;
          }
          // Find item by name in inventory
          const itemName = args.join(" ").toLowerCase();
          let itemId = null;
          for (const id of engine.state.inventory) {
            const item = engine.world.items.get(id);
            if (item && item.name.toLowerCase().includes(itemName)) {
              itemId = id;
              break;
            }
          }
          if (itemId) {
            engine.dropItem(itemId);
          } else {
            engine.printLine("You don't have that item.");
          }
        },
        help: "Drop an item",
        purpose: "drop something you don't need anymore",
        weight: 4
      });
      // Inventory command
      this.registerCommand({
        name: "inventory",
        aliases: ["i"],
        fn: (args, engine) => {
          if (engine.state.inventory.length === 0) {
            engine.printLine("You are carrying nothing.");
            return;
          }
          engine.printLine("{{bold}}You are carrying:{{font_reset}}");
          for (const itemId of engine.state.inventory) {
            const item = engine.world.items.get(itemId);
            if (item) {
              engine.printLine(`- ${item.name}`);
            }
          }
        },
        help: "Show your inventory",
        purpose: "show items you have",
        weight: 5
      });
      // Use command
      this.registerCommand({
        name: "use",
        display: "use [item]",
        fn: (args, engine) => {
          if (args.length === 0) {
            engine.printLine("Use what?");
            return;
          }
          const itemName = args.join(" ").toLowerCase();
          // First check inventory
          let itemId = null;
          for (const id of engine.state.inventory) {
            const item = engine.world.items.get(id);
            if (item && (
              item.name.toLowerCase().includes(itemName) ||
              (item.aliases && item.aliases.some(alias => alias.toLowerCase().includes(itemName)))
            )) {
              itemId = id;
              break;
            }
          }
          if (itemId) {
            // Use item from inventory
            engine.useItem(itemId);
          } else {
            // Try to use untakeable item in the room
            engine.useUntakeableItem(itemName);
          }
        },
        help: "Use an item from inventory or in the environment",
        purpose: "use something you have close",
        weight: 6
      });
      // Say command
      this.registerCommand({
        name: "say",
        display: "say [...]",
        fn: (args, engine) => {
          if (args.length === 0) {
            engine.printLine("You don't say");
            return;
          }
          const line = args.join(" ");
          engine.printLine(`You say:{{n}} - ${line}`);
          // Trigger character reactions
          const room = engine.world.rooms.get(engine.state.currentRoom);
          if (room && room.characters) {
            let interrupt = false;
            room.characters.forEach(charId => {
              const character = engine.world.characters.get(charId);
              if (character && character.onSay && !interrupt) {
                interrupt = character.onSay(line, engine.state, engine) ? true : false;
              }
            });
          }
        },
        help: "Say something",
        purpose: "say something",
        weight: 7
      });
      // Talk command
      this.registerCommand({
        name: "talk",
        display: "talk [character] about [topic]",
        fn: (args, engine) => {
          if (args.length === 0) {
            const room = engine.world.rooms.get(engine.state.currentRoom);
            if (!room || !room.characters || room.characters.length === 0) {
              engine.printLine("Talk to whom? There's no one here.");
              return;
            }
            engine.printLine("Who would you like to talk to?");
            const charList = room.characters
              .map(id => {
                const character = engine.world.characters.get(id);
                if (!character) return "unknown character";
                let display = `- ${character.name}`;
                if (character.aliases) {
                  display += ` (also: ${character.aliases.join(', ')})`;
                }
                if (character.genre && room.characters.length === 1) {
                  display += ` or use "talk ${character.genre === "male" ? "him" : "her"}"`;
                }
                return display;
              })
              .join("\n");
            engine.printLine(charList);
            return;
          }
          const room = engine.world.rooms.get(engine.state.currentRoom);
          if (!room || !room.characters) {
            engine.printLine("There's no one here to talk to.");
            return;
          }
          // Parse command for "about" keyword
          const aboutIndex = args.findIndex(arg => arg === "about");
          let topic = null;
          let charIdentifier;
          if (aboutIndex !== -1) {
            charIdentifier = args.slice(0, aboutIndex).join(" ").toLowerCase();
            topic = args.slice(aboutIndex + 1).join(" ").toLowerCase();
          } else {
            charIdentifier = args.join(" ").toLowerCase();
          }
          // Find character by name, alias, or genre pronoun
          let characterId = null;
          let character = null;
          for (const id of room.characters) {
            const char = engine.world.characters.get(id);
            if (!char) continue;
            // Check main name
            if (char.name.toLowerCase().includes(charIdentifier)) {
              characterId = id;
              character = char;
              break;
            }
            // Check aliases
            if (char.aliases) {
              for (const alias of char.aliases) {
                if (alias.toLowerCase().includes(charIdentifier)) {
                  characterId = id;
                  character = char;
                  break;
                }
              }
              if (characterId) break;
            }
            // Check genre pronoun (only if single character in room)
            if (char.genre && room.characters.length === 1) {
              if ((char.genre === 'female' && (charIdentifier === 'her' || charIdentifier === 'she')) ||
                  (char.genre === 'male' && (charIdentifier === 'him' || charIdentifier === 'he'))) {
                characterId = id;
                character = char;
                break;
              }
            }
          }
          if (!characterId) {
            engine.printLine("You don't see that person here.");
            return;
          }
          // Handle topic-based conversation
          if (topic && character.topics) {
            let foundTopic = false;
            for (const [topicKey, topicData] of Object.entries(character.topics)) {
              if (topicKey.toLowerCase().includes(topic) || 
                  (topicData.aliases && topicData.aliases.some(alias => alias.toLowerCase().includes(topic)))) {
                if (topicData.condition && !topicData.condition(engine.state)) {
                  engine.printLine(topicData.blockedMessage || `${character.name} doesn't want to talk about that right now.`);
                } else {
                  topicData.dialog(engine.state, engine);
                  // Update flags if specified
                  if (topicData.setFlag) {
                    engine.state.flags[topicData.setFlag] = true;
                  }
                }
                foundTopic = true;
                break;
              }
            }
            if (!foundTopic) {
              engine.printLine(`${character.shortName || character.name} doesn't seem to know anything about "${topic}".`);
            }
          } else {
            // Standard talk interaction
            if (character.talk) {
              character.talk(engine.state, engine);
            } else {
              engine.printLine(`${character.shortName || character.name} has nothing to say to you right now.`);
            }
          }
        },
        help: "Talk to someone or ask about a specific topic",
        purpose: "talk to someone or ask about a specific topic",
        weight: 8
      });
      // Save command
      this.registerCommand({
        name: "save", 
        display: "save [slot]",
        fn: (args, engine) => {
          const slot = args.length > 0 ? args[0] : "default";
          engine.saveGame(slot);
        },
        help: "Save the game",
        purpose: "save the game",
        weight: 9
      });
      // Load command
      this.registerCommand({
        name: "load",
        display: "load [slot]",
        fn: (args, engine) => {
          const slot = args.length > 0 ? args[0] : "default";
          engine.loadGame(slot);
        },
        help: "Load a saved game",
        purpose: "load a saved game",
        weight: 10
      });
      // Restart command
      this.registerCommand({
        name: "restart",
        fn: () => this.restartGame(),
        help: "Restart the game",
        purpose: "restart the game",
        weight: 11
      });
      // Quit command
      this.registerCommand({
        name: "quit",
        aliases: ["exit"],
        fn: (args, engine) => {
          engine.printLine("{{green}}Goodbye!{{color_reset}}");
          if (engine.env === "node") {
            engine.rl.close();
          } else {
            // In browser, we can't really quit, so just clear and reset
            engine.stopAllAnimations();
            engine.state = {
              currentRoom: null,
              inventory: [],
              flags: {},
              variables: {},
              history: [],
              gameTime: 0
            };
            engine.clearScreen();
          }
        },
        help: "Quit the game",
        purpose: "finish playing",
        weight: 999
      });
    }
    // Novel loading
    async loadNovel(novel) {
      try {
        novel = await this.prepareModule(novel);
        // Clear existing world
        this.world.rooms.clear();
        this.world.items.clear();
        this.world.characters.clear();
        this.world.events.clear();
        // Keep commands and keybindings
        const commands = new Map(this.world.commands);
        const keybindings = new Map(this.world.keybindings);
        this.world.commands = commands;
        this.world.keybindings = keybindings;
        // Load novel data
        if (novel.rooms) {
          for (const room of novel.rooms) {
            this.addRoom(room);
          }
        }
        if (novel.items) {
          for (const item of novel.items) {
            this.addItem(item);
          }
        }
        if (novel.characters) {
          for (const character of novel.characters) {
            this.addCharacter(character);
          }
        }
        if (novel.events) {
          for (const event of novel.events) {
            this.addEvent(event);
          }
        }
        if (novel.startRoom) {
          this.state.currentRoom = novel.startRoom;
        } else {
          this.state.currentRoom = null;
        }
        if (this.config.clearScreenOnNovelLoad) {
          this.clearScreen();
        }
        this.startGame(this.state.currentRoom);
        return true;
      } catch (error) {
        this.printLine(`Error loading novel: ${error.message}`);
        if (this.config.debug) {
          console.error(error);
        }
        return false;
      }
    }
  }
  
  return {
    ANSI_COLORS,
    ANSI_STYLES,
    VERSION,
    STORAGE_KEY,
    DEFAULT_PROMPT,
    DEFAULT_THEME,
    DEFAULT_CONFIG,
    Game,
    Utils
  };
});