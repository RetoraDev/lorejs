// L.O.R.E. - Line-Oriented Recursive Engine
// A text adventure engine for Node.js and browsers with markdown formatting

(function (global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        global.LORE = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    // Constants
    const VERSION = '1.1.0';
    const STORAGE_KEY = 'lore_save_data';
    const DEFAULT_PROMPT = '> ';
    const DEFAULT_THEME = {
        '--lore-bg-color': '#000000',
        '--lore-text-color': '#ffffff',
        '--lore-prompt-color': '#00ff00',
        '--lore-input-color': '#ffffff',
        '--lore-font-family': 'monospace',
        '--lore-font-size': '16px',
        '--lore-border-color': '#333333'
    };

    // ANSI color codes for Node.js
    const ANSI_COLORS = {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };

    const ANSI_STYLES = {
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        thick: '\x1b[1m',
        strong: '\x1b[1m',
        b: '\x1b[1m',
        italic: '\x1b[3m',
        cursive: '\x1b[3m',
        i: '\x1b[3m',
        underline: '\x1b[4m',
        u: '\x1b[4m',
        blink: '\x1b[5m',
        inverse: '\x1b[7m',
        hidden: '\x1b[8m'
    };

    // Utility functions
    const utils = {
        isBrowser: typeof window !== 'undefined' && typeof document !== 'undefined',
        isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
        deepClone: function (obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        uuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        debounce: function (func, wait) {
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
        // Color name to hex mapping
        colorNameToHex: function (color) {
            const colors = {
                black: '#000000',
                red: '#ff0000',
                green: '#00ff00',
                yellow: '#ffff00',
                blue: '#0000ff',
                magenta: '#ff00ff',
                cyan: '#00ffff',
                white: '#ffffff'
            };
            return colors[color.toLowerCase()] || color;
        },
        // Check if a string is a valid color
        isValidColor: function (color) {
            if (!color) return false;
            
            // Check if it's a named color
            const namedColors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            if (namedColors.includes(color.toLowerCase())) return true;
            
            // Check if it's a hex color
            return /^#?([0-9A-F]{3}){1,2}$/i.test(color);
        }
    };

    // Core Engine Class
    class LOREEngine {
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
                prompt: options.prompt || DEFAULT_PROMPT,
                autosave: options.autosave !== false,
                saveSlots: options.saveSlots || 3,
                typingSpeed: options.typingSpeed || 0,
                debug: options.debug || false
            };

            this.world = {
                rooms: new Map(),
                items: new Map(),
                characters: new Map(),
                events: new Map(),
                commands: new Map(),
                keybindings: new Map()
            };

            this.plugins = new Map();
            this.theme = utils.deepClone(DEFAULT_THEME);
            this.historyIndex = -1;
            this.isRunning = false;
            this.outputBuffer = [];
            this.animationFrames = new Map();
            this.animationIntervals = new Map();

            // Formatting state
            this.formattingState = {
                color: null,
                bold: false,
                italic: false,
                underline: false
            };

            // Initialize based on environment
            if (utils.isBrowser) {
                this.initBrowser();
            } else if (utils.isNode) {
                this.initNode();
            }

            // Register default commands
            this.registerDefaultCommands();
        }

        // Environment initialization
        initBrowser() {
            this.env = 'browser';
            
            // Create terminal elements
            this.terminalElement = document.createElement('div');
            this.terminalElement.className = 'lore-terminal';
            this.terminalElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: ${this.theme['--lore-bg-color']};
                color: ${this.theme['--lore-text-color']};
                font-family: ${this.theme['--lore-font-family']};
                font-size: ${this.theme['--lore-font-size']};
                overflow: auto;
                padding: 20px;
                box-sizing: border-box;
            `;

            this.outputElement = document.createElement('div');
            this.outputElement.className = 'lore-output';
            this.outputElement.style.cssText = `
                height: calc(100% - 60px);
                overflow-y: auto;
                margin-bottom: 10px;
                white-space: pre-wrap;
            `;

            this.inputContainer = document.createElement('div');
            this.inputContainer.className = 'lore-input-container';
            this.inputContainer.style.cssText = `
                display: flex;
                align-items: center;
            `;

            this.promptElement = document.createElement('span');
            this.promptElement.className = 'lore-prompt';
            this.promptElement.textContent = this.config.prompt;
            this.promptElement.style.color = this.theme['--lore-prompt-color'];

            this.inputElement = document.createElement('input');
            this.inputElement.className = 'lore-input';
            this.inputElement.type = 'text';
            this.inputElement.style.cssText = `
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: ${this.theme['--lore-input-color']};
                font-family: ${this.theme['--lore-font-family']};
                font-size: ${this.theme['--lore-font-size']};
                margin-left: 5px;
            `;

            // Assemble terminal
            this.inputContainer.appendChild(this.promptElement);
            this.inputContainer.appendChild(this.inputElement);
            this.terminalElement.appendChild(this.outputElement);
            this.terminalElement.appendChild(this.inputContainer);
            
            // Add to document if not already present
            if (!document.querySelector('.lore-terminal')) {
                document.body.appendChild(this.terminalElement);
                document.body.style.margin = '0';
                document.body.style.padding = '0';
            }

            // Set up event listeners
            this.setupBrowserEvents();
        }

        initNode() {
            this.env = 'node';
            this.readline = require('readline');
            this.fs = require('fs');
            this.path = require('path');

            this.rl = this.readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: this.config.prompt
            });

            this.setupNodeEvents();
        }

        // Event setup
        setupBrowserEvents() {
            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.processInput(this.inputElement.value);
                    this.inputElement.value = '';
                    e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    this.navigateHistory(-1);
                    e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                    this.navigateHistory(1);
                    e.preventDefault();
                } else if (e.key === 'Tab') {
                    this.autoComplete();
                    e.preventDefault();
                }
            });

            // Handle window resize
            window.addEventListener('resize', utils.debounce(() => {
                this.outputElement.scrollTop = this.outputElement.scrollHeight;
            }, 250));

            // Focus input on terminal click
            this.terminalElement.addEventListener('click', () => {
                this.inputElement.focus();
            });
        }

        setupNodeEvents() {
            this.rl.on('line', (input) => {
                this.processInput(input);
                this.rl.prompt();
            }).on('close', () => {
                process.exit(0);
            });

            // Set up tab completion for Node
            this.rl.on('SIGINT', () => {
                this.rl.question('Are you sure you want to exit? (y/n) ', (answer) => {
                    if (answer.match(/^y(es)?$/i)) {
                        this.rl.close();
                    } else {
                        this.rl.prompt();
                    }
                });
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
                } else if (utils.isValidColor(tag)) {
                    // Close previous color span if exists
                    if (this.formattingState.color) {
                        result += '</span>';
                    }
                    
                    const color = utils.colorNameToHex(tag.replace('#', ''));
                    result += `<span style="color: ${color}">`;
                    this.formattingState.color = color;
                } else if (tag === 'bold' || tag === 'thick' || tag === 'strong' || tag === 'b') {
                    if (!this.formattingState.bold) {
                        result += '<strong>';
                        this.formattingState.bold = true;
                    }
                } else if (tag === 'italic' || tag === 'cursive' || tag === 'i') {
                    if (!this.formattingState.italic) {
                        result += '<em>';
                        this.formattingState.italic = true;
                    }
                } else if (tag === 'underline' || tag === 'u') {
                    if (!this.formattingState.underline) {
                        result += '<span style="text-decoration: underline">';
                        this.formattingState.underline = true;
                    }
                } else if (tag === 'newline' || tag === 'n') {
                    result += '<br>';
                } else if (tag === 'tabulator' || tag === 'tab' || tag === 't') {
                    result += '&nbsp;&nbsp;&nbsp;&nbsp;';
                }
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
                } else if (utils.isValidColor(tag)) {
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
                } else if (tag === 'tabulator' || tag === 'tab' || tag === 't') {
                    result += '\t';
                }
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

        // Command processing
        processInput(input) {
            if (!input.trim()) return;

            // Add to history
            this.state.history.push(input);
            this.historyIndex = this.state.history.length;

            // Echo input
            this.printLine(`${this.config.prompt}${input}`);

            // Parse and execute command
            const [command, ...args] = input.trim().split(/\s+/);
            const normalizedCommand = command.toLowerCase();

            if (this.world.commands.has(normalizedCommand)) {
                try {
                    const commandFn = this.world.commands.get(normalizedCommand);
                    commandFn(args, this);
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
                this.saveGame('autosave');
            }
        }

        navigateHistory(direction) {
            if (this.state.history.length === 0) return;

            this.historyIndex += direction;
            
            if (this.historyIndex < 0) {
                this.historyIndex = 0;
            } else if (this.historyIndex >= this.state.history.length) {
                this.historyIndex = this.state.history.length;
                this.inputElement.value = '';
                return;
            }
            
            this.inputElement.value = this.state.history[this.historyIndex];
        }

        autoComplete() {
            const input = this.inputElement.value.trim();
            if (!input) return;

            const inputParts = input.split(' ');
            const currentWord = inputParts[inputParts.length - 1].toLowerCase();
            
            // Find matching commands
            const matches = [];
            for (const [command] of this.world.commands) {
                if (command.startsWith(currentWord)) {
                    matches.push(command);
                }
            }
            
            // Find matching items in inventory
            for (const itemId of this.state.inventory) {
                const item = this.world.items.get(itemId);
                if (item && item.name.toLowerCase().startsWith(currentWord)) {
                    matches.push(item.name.toLowerCase());
                }
            }
            
            // Find matching room items
            const currentRoom = this.world.rooms.get(this.state.currentRoom);
            if (currentRoom) {
                for (const itemId of currentRoom.items || []) {
                    const item = this.world.items.get(itemId);
                    if (item && item.name.toLowerCase().startsWith(currentWord)) {
                        matches.push(item.name.toLowerCase());
                    }
                }
                
                // Find matching room exits
                for (const exit of Object.keys(currentRoom.exits || {})) {
                    if (exit.toLowerCase().startsWith(currentWord)) {
                        matches.push(exit.toLowerCase());
                    }
                }
            }
            
            if (matches.length === 1) {
                inputParts[inputParts.length - 1] = matches[0];
                this.inputElement.value = inputParts.join(' ');
            } else if (matches.length > 1) {
                // Find common prefix
                const commonPrefix = this.findCommonPrefix(matches);
                if (commonPrefix.length > currentWord.length) {
                    inputParts[inputParts.length - 1] = commonPrefix;
                    this.inputElement.value = inputParts.join(' ');
                }
                
                // Show suggestions
                this.printLine('Suggestions: ' + matches.join(', '));
            }
        }

        findCommonPrefix(strings) {
            if (strings.length === 0) return '';
            
            let prefix = strings[0];
            for (let i = 1; i < strings.length; i++) {
                while (strings[i].indexOf(prefix) !== 0) {
                    prefix = prefix.substring(0, prefix.length - 1);
                    if (prefix === '') return '';
                }
            }
            return prefix;
        }

        // Output methods
        print(text) {
            const formattedText = this.parseFormatting(text);
            
            if (this.env === 'browser') {
                const div = document.createElement('div');
                div.innerHTML = formattedText;
                this.outputElement.appendChild(div);
                this.outputElement.scrollTop = this.outputElement.scrollHeight;
            } else {
                process.stdout.write(formattedText);
            }
        }

        printLine(text = '') {
            this.print(text + (this.env === 'browser' ? '<br>' : '\n'));
        }

        clearScreen() {
            if (this.env === 'browser') {
                this.outputElement.innerHTML = '';
            } else {
                process.stdout.write('\x1B[2J\x1B[0f');
            }
        }

        // Game state management
        startGame(startRoomId) {
            this.isRunning = true;
            this.state.currentRoom = startRoomId;
            this.look();
            
            if (this.env === 'node') {
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
            this.printLine('Game restarted.');
            
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
            const nextRoom = this.world.rooms.get(nextRoomId);
            
            if (!nextRoom) {
                this.printLine(`The path leads nowhere.`);
                return false;
            }

            // Check if there's a condition for entering this room
            if (nextRoom.condition && !nextRoom.condition(this.state)) {
                this.printLine(nextRoom.blockedMessage || `You can't go that way right now.`);
                return false;
            }

            this.state.currentRoom = nextRoomId;
            this.state.gameTime++;
            
            // Call onEnter callback if defined
            if (nextRoom.onEnter) {
                nextRoom.onEnter(this.state, this);
            }
            
            this.look();
            return true;
        }

        look() {
            const room = this.world.rooms.get(this.state.currentRoom);
            if (!room) {
                this.printLine("You are in the void.");
                return;
            }

            // Display room name and description
            this.printLine(room.name);
            this.printLine('');
            
            // Display room image if available
            if (room.image) {
                this.displayImage(room.image, room.imageOptions);
                this.printLine('');
            }
            
            this.printLine(room.description);
            this.printLine('');

            // Display items in room
            if (room.items && room.items.length > 0) {
                const itemList = room.items.map(id => {
                    const item = this.world.items.get(id);
                    return item ? item.name : 'unknown item';
                }).join(', ');
                
                this.printLine(`You see: ${itemList}`);
            }

            // Display characters in room
            if (room.characters && room.characters.length > 0) {
                const charList = room.characters.map(id => {
                    const character = this.world.characters.get(id);
                    return character ? character.name : 'unknown character';
                }).join(', ');
                
                this.printLine(`You see: ${charList}`);
            }

            // Display exits
            if (room.exits) {
                const exitList = Object.keys(room.exits).join(', ');
                this.printLine(`Exits: ${exitList}`);
            }
        }

        // Image display
        displayImage(image, options = {}) {
            if (Array.isArray(image)) {
                // Animated image
                this.displayAnimatedImage(image, options);
            } else if (typeof image === 'string') {
                // Static image
                this.printLine(image);
            }
        }

        displayAnimatedImage(frames, options = {}) {
            const {
                frameTime = 200,
                loop = true,
                reverse = false,
                mirror = false
            } = options;

            const animationId = utils.uuid();
            let currentFrame = 0;
            let direction = 1;
            let frameSequence = [...frames];
            
            if (reverse) {
                frameSequence.reverse();
            }
            
            if (mirror) {
                frameSequence = [...frameSequence, ...frameSequence.slice(1, -1).reverse()];
            }

            const animate = () => {
                if (!this.animationIntervals.has(animationId)) return;
                
                // Clear previous frame
                if (this.env === 'browser') {
                    const lastImage = this.outputElement.querySelector(`.lore-animation-${animationId}`);
                    if (lastImage) {
                        this.outputElement.removeChild(lastImage);
                    }
                }
                
                // Display current frame
                const pre = this.env === 'browser' ? '<pre style="white-space: pre; margin: 0;">' : '';
                const post = this.env === 'browser' ? '</pre>' : '';
                this.printLine(`${pre}${frameSequence[currentFrame]}${post}`);
                
                if (this.env === 'browser') {
                    const elements = this.outputElement.querySelectorAll('pre, span');
                    const lastElement = elements[elements.length - 1];
                    if (lastElement) {
                        lastElement.classList.add(`lore-animation-${animationId}`);
                    }
                }
                
                // Update frame index
                currentFrame += direction;
                
                // Handle end of animation
                if (currentFrame >= frameSequence.length) {
                    if (loop) {
                        currentFrame = 0;
                    } else {
                        this.stopAnimation(animationId);
                        return;
                    }
                }
            };

            // Start animation
            this.animationIntervals.set(animationId, setInterval(animate, frameTime));
            this.animationFrames.set(animationId, frameSequence);
            
            // Run first frame immediately
            animate();
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
            if (this.env === 'browser') {
                const elements = this.outputElement.querySelectorAll(`.lore-animation-${animationId}`);
                elements.forEach(el => el.remove());
            }
        }

        stopAllAnimations() {
            for (const id of this.animationIntervals.keys()) {
                this.stopAnimation(id);
            }
        }

        // Inventory management
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
                this.printLine(`You can't take the ${item.name}.`);
                return false;
            }

            // Remove from room, add to inventory
            room.items = room.items.filter(id => id !== itemId);
            this.state.inventory.push(itemId);

            this.printLine(`You take the ${item.name}.`);
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

            this.printLine(`You drop the ${item.name}.`);
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
                    this.printLine(`You can't use the ${item.name} that way.`);
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

            this.printLine(`Using the ${item.name} on the ${target.name} doesn't seem to do anything.`);
            return false;
        }

        // Dialog functions
        async confirm(prompt) {
            if (this.env === 'browser') {
                return new Promise((resolve) => {
                    // Create modal for browser
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    `;
                    
                    const dialog = document.createElement('div');
                    dialog.style.cssText = `
                        background: ${this.theme['--lore-bg-color']};
                        color: ${this.theme['--lore-text-color']};
                        padding: 20px;
                        border: 1px solid ${this.theme['--lore-border-color']};
                        border-radius: 5px;
                        max-width: 80%;
                    `;
                    
                    const text = document.createElement('p');
                    text.innerHTML = this.parseFormatting(prompt);
                    text.style.margin = '0 0 15px 0';
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.justifyContent = 'flex-end';
                    buttonContainer.style.gap = '10px';
                    
                    const yesButton = document.createElement('button');
                    yesButton.textContent = 'Yes';
                    yesButton.onclick = () => {
                        document.body.removeChild(modal);
                        resolve(true);
                    };
                    
                    const noButton = document.createElement('button');
                    noButton.textContent = 'No';
                    noButton.onclick = () => {
                        document.body.removeChild(modal);
                        resolve(false);
                    };
                    
                    buttonContainer.appendChild(yesButton);
                    buttonContainer.appendChild(noButton);
                    
                    dialog.appendChild(text);
                    dialog.appendChild(buttonContainer);
                    modal.appendChild(dialog);
                    document.body.appendChild(modal);
                });
            } else {
                // Node.js implementation
                return new Promise((resolve) => {
                    this.rl.question(`${this.parseFormatting(prompt)} (y/n) `, (answer) => {
                        resolve(answer.match(/^y(es)?$/i) !== null);
                    });
                });
            }
        }

        async selectFromList(prompt, options) {
            if (this.env === 'browser') {
                return new Promise((resolve) => {
                    // Create modal for browser
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    `;
                    
                    const dialog = document.createElement('div');
                    dialog.style.cssText = `
                        background: ${this.theme['--lore-bg-color']};
                        color: ${this.theme['--lore-text-color']};
                        padding: 20px;
                        border: 1px solid ${this.theme['--lore-border-color']};
                        border-radius: 5px;
                        max-width: 80%;
                        max-height: 80%;
                        overflow-y: auto;
                    `;
                    
                    const text = document.createElement('p');
                    text.innerHTML = this.parseFormatting(prompt);
                    text.style.margin = '0 0 15px 0';
                    
                    const list = document.createElement('ul');
                    list.style.listStyle = 'none';
                    list.style.padding = '0';
                    list.style.margin = '0';
                    
                    options.forEach((option, index) => {
                        const li = document.createElement('li');
                        li.style.padding = '8px 5px';
                        li.style.cursor = 'pointer';
                        li.style.borderBottom = `1px solid ${this.theme['--lore-border-color']}`;
                        li.innerHTML = this.parseFormatting(option);
                        
                        li.addEventListener('click', () => {
                            document.body.removeChild(modal);
                            resolve(index);
                        });
                        
                        li.addEventListener('mouseover', () => {
                            li.style.backgroundColor = '#333';
                        });
                        
                        li.addEventListener('mouseout', () => {
                            li.style.backgroundColor = 'transparent';
                        });
                        
                        list.appendChild(li);
                    });
                    
                    const cancelButton = document.createElement('button');
                    cancelButton.textContent = 'Cancel';
                    cancelButton.style.marginTop = '15px';
                    cancelButton.onclick = () => {
                        document.body.removeChild(modal);
                        resolve(-1);
                    };
                    
                    dialog.appendChild(text);
                    dialog.appendChild(list);
                    dialog.appendChild(cancelButton);
                    modal.appendChild(dialog);
                    document.body.appendChild(modal);
                });
            } else {
                // Node.js implementation
                this.printLine(prompt);
                options.forEach((option, index) => {
                    this.printLine(`${index + 1}. ${option}`);
                });
                
                return new Promise((resolve) => {
                    this.rl.question('Select an option (number) or 0 to cancel: ', (answer) => {
                        const choice = parseInt(answer, 10);
                        if (isNaN(choice) || choice < 0 || choice > options.length) {
                            this.printLine('Invalid selection.');
                            resolve(-1);
                        } else if (choice === 0) {
                            resolve(-1);
                        } else {
                            resolve(choice - 1);
                        }
                    });
                });
            }
        }

        // Save/load system
        saveGame(slot = 'default') {
            const saveData = {
                state: utils.deepClone(this.state),
                timestamp: Date.now(),
                slot: slot
            };

            if (this.env === 'browser') {
                const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                saves[slot] = saveData;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
                this.printLine(`Game saved in slot: ${slot}`);
            } else {
                const saveDir = this.path.join(__dirname, 'saves');
                if (!this.fs.existsSync(saveDir)) {
                    this.fs.mkdirSync(saveDir, { recursive: true });
                }
                
                const savePath = this.path.join(saveDir, `save_${slot}.json`);
                this.fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));
                this.printLine(`Game saved in slot: ${slot}`);
            }
        }

        loadGame(slot = 'default') {
            try {
                let saveData;
                
                if (this.env === 'browser') {
                    const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                    saveData = saves[slot];
                } else {
                    const savePath = this.path.join(__dirname, 'saves', `save_${slot}.json`);
                    if (!this.fs.existsSync(savePath)) {
                        this.printLine(`No save file found in slot: ${slot}`);
                        return false;
                    }
                    
                    saveData = JSON.parse(this.fs.readFileSync(savePath, 'utf8'));
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

        deleteSave(slot = 'default') {
            try {
                if (this.env === 'browser') {
                    const saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                    if (saves[slot]) {
                        delete saves[slot];
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
                        this.printLine(`Save slot ${slot} deleted.`);
                        return true;
                    }
                } else {
                    const savePath = this.path.join(__dirname, 'saves', `save_${slot}.json`);
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
                
                if (this.env === 'browser') {
                    saves = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                } else {
                    const saveDir = this.path.join(__dirname, 'saves');
                    if (this.fs.existsSync(saveDir)) {
                        const files = this.fs.readdirSync(saveDir);
                        files.forEach(file => {
                            if (file.startsWith('save_') && file.endsWith('.json')) {
                                const slot = file.replace('save_', '').replace('.json', '');
                                const savePath = this.path.join(saveDir, file);
                                const saveData = JSON.parse(this.fs.readFileSync(savePath, 'utf8'));
                                saves[slot] = saveData;
                            }
                        });
                    }
                }
                
                if (Object.keys(saves).length === 0) {
                    this.printLine('No save files found.');
                    return;
                }
                
                this.printLine('Available saves:');
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
                room.id = utils.uuid();
            }
            this.world.rooms.set(room.id, room);
            return room.id;
        }

        addItem(item) {
            if (!item.id) {
                item.id = utils.uuid();
            }
            this.world.items.set(item.id, item);
            return item.id;
        }

        addCharacter(character) {
            if (!character.id) {
                character.id = utils.uuid();
            }
            this.world.characters.set(character.id, character);
            return character.id;
        }

        addEvent(event) {
            if (!event.id) {
                event.id = utils.uuid();
            }
            this.world.events.set(event.id, event);
            return event.id;
        }

        // Plugin system
        async loadPlugin(plugin) {
            try {
                // If plugin is a URL, fetch it
                if (typeof plugin === 'string' && (plugin.startsWith('http://') || plugin.startsWith('https://'))) {
                    if (this.env === 'browser') {
                        const response = await fetch(plugin);
                        plugin = await response.json();
                    } else {
                        const https = require('https');
                        plugin = await new Promise((resolve, reject) => {
                            https.get(plugin, (response) => {
                                let data = '';
                                response.on('data', (chunk) => data += chunk);
                                response.on('end', () => resolve(JSON.parse(data)));
                            }).on('error', reject);
                        });
                    }
                }
                
                // If plugin is a string, parse as JSON
                if (typeof plugin === 'string') {
                    plugin = JSON.parse(plugin);
                }
                
                // Register plugin
                if (plugin.id && !this.plugins.has(plugin.id)) {
                    this.plugins.set(plugin.id, plugin);
                    
                    // Apply plugin components
                    if (plugin.commands) {
                        for (const [name, command] of Object.entries(plugin.commands)) {
                            this.registerCommand(name, command);
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
                    
                    this.printLine(`Plugin loaded: ${plugin.name || plugin.id}`);
                    return true;
                } else {
                    this.printLine('Invalid plugin format: missing id');
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
        loadTheme(theme) {
            try {
                // If theme is a URL, fetch it
                if (typeof theme === 'string' && (theme.startsWith('http://') || theme.startsWith('https://'))) {
                    if (this.env === 'browser') {
                        // In browser, we would need to use fetch but this is complex due to async nature
                        // For simplicity, we'll just support object themes in this implementation
                        this.printLine('URL themes are not supported in this implementation.');
                        return false;
                    } else {
                        const https = require('https');
                        // Async operation would be complex here, so we'll just support object themes
                        this.printLine('URL themes are not supported in this implementation.');
                        return false;
                    }
                }
                
                // If theme is a string, parse as JSON
                if (typeof theme === 'string') {
                    theme = JSON.parse(theme);
                }
                
                // Apply theme
                this.theme = { ...this.theme, ...theme };
                
                if (this.env === 'browser') {
                    // Update CSS variables
                    for (const [property, value] of Object.entries(this.theme)) {
                        document.documentElement.style.setProperty(property, value);
                    }
                    
                    // Update terminal styles
                    this.terminalElement.style.backgroundColor = this.theme['--lore-bg-color'];
                    this.terminalElement.style.color = this.theme['--lore-text-color'];
                    this.terminalElement.style.fontFamily = this.theme['--lore-font-family'];
                    this.terminalElement.style.fontSize = this.theme['--lore-font-size'];
                    
                    this.promptElement.style.color = this.theme['--lore-prompt-color'];
                    this.inputElement.style.color = this.theme['--lore-input-color'];
                }
                
                this.printLine('Theme applied.');
                return true;
            } catch (error) {
                this.printLine(`Error loading theme: ${error.message}`);
                if (this.config.debug) {
                    console.error(error);
                }
                return false;
            }
        }

        // Command registration
        registerCommand(name, commandFn) {
            this.world.commands.set(name.toLowerCase(), commandFn);
        }

        registerKeybinding(key, action) {
            this.world.keybindings.set(key, action);
        }

        registerDefaultCommands() {
            // Help command
            this.registerCommand('help', (args, engine) => {
                engine.printLine('{{bold}}Available commands:{{font_reset}}');
                engine.printLine('  {{green}}look{{color_reset}}, {{green}}l{{color_reset}} - Look around the current room');
                engine.printLine('  {{green}}go [direction]{{color_reset}} - Move in a direction (north, south, east, west, etc.)');
                engine.printLine('  {{green}}take [item]{{color_reset}} - Take an item');
                engine.printLine('  {{green}}drop [item]{{color_reset}} - Drop an item');
                engine.printLine('  {{green}}inventory{{color_reset}}, {{green}}i{{color_reset}} - Show your inventory');
                engine.printLine('  {{green}}use [item]{{color_reset}} - Use an item');
                engine.printLine('  {{green}}use [item] on [target]{{color_reset}} - Use an item on a target');
                engine.printLine('  {{green}}talk [character]{{color_reset}} - Talk to a character');
                engine.printLine('  {{green}}save [slot]{{color_reset}} - Save the game');
                engine.printLine('  {{green}}load [slot]{{color_reset}} - Load a saved game');
                engine.printLine('  {{green}}restart{{color_reset}} - Restart the game');
                engine.printLine('  {{green}}quit{{color_reset}} - Quit the game');
                engine.printLine('  {{green}}help{{color_reset}} - Show this help');
            });

            // Look command
            this.registerCommand('look', (args, engine) => {
                engine.look();
            });
            this.registerCommand('l', (args, engine) => {
                engine.look();
            });

            // Movement commands
            this.registerCommand('go', (args, engine) => {
                if (args.length === 0) {
                    engine.printLine('Go where?');
                    return;
                }
                engine.move(args[0]);
            });

            // Direction shortcuts
            const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'up', 'down', 'in', 'out'];
            directions.forEach(dir => {
                this.registerCommand(dir, (args, engine) => {
                    engine.move(dir);
                });
                
                // Shortcuts
                if (dir === 'north') this.registerCommand('n', (args, engine) => engine.move('north'));
                if (dir === 'south') this.registerCommand('s', (args, engine) => engine.move('south'));
                if (dir === 'east') this.registerCommand('e', (args, engine) => engine.move('east'));
                if (dir === 'west') this.registerCommand('w', (args, engine) => engine.move('west'));
                if (dir === 'northeast') this.registerCommand('ne', (args, engine) => engine.move('northeast'));
                if (dir === 'northwest') this.registerCommand('nw', (args, engine) => engine.move('northwest'));
                if (dir === 'southeast') this.registerCommand('se', (args, engine) => engine.move('southeast'));
                if (dir === 'southwest') this.registerCommand('sw', (args, engine) => engine.move('southwest'));
                if (dir === 'up') this.registerCommand('u', (args, engine) => engine.move('up'));
                if (dir === 'down') this.registerCommand('d', (args, engine) => engine.move('down'));
            });

            // Take command
            this.registerCommand('take', (args, engine) => {
                if (args.length === 0) {
                    engine.printLine('Take what?');
                    return;
                }
                
                const room = engine.world.rooms.get(engine.state.currentRoom);
                if (!room || !room.items) {
                    engine.printLine("There's nothing to take here.");
                    return;
                }
                
                // Find item by name
                const itemName = args.join(' ').toLowerCase();
                let itemId = null;
                
                for (const id of room.items) {
                    const item = engine.world.items.get(id);
                    if (item && item.name.toLowerCase().includes(itemName)) {
                        itemId = id;
                        break;
                    }
                }
                
                if (itemId) {
                    engine.takeItem(itemId);
                } else {
                    engine.printLine("You don't see that here.");
                }
            });

            // Drop command
            this.registerCommand('drop', (args, engine) => {
                if (args.length === 0) {
                    engine.printLine('Drop what?');
                    return;
                }
                
                // Find item by name in inventory
                const itemName = args.join(' ').toLowerCase();
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
            });

            // Inventory command
            this.registerCommand('inventory', (args, engine) => {
                if (engine.state.inventory.length === 0) {
                    engine.printLine('You are carrying nothing.');
                    return;
                }
                
                engine.printLine('{{bold}}You are carrying:{{font_reset}}');
                for (const itemId of engine.state.inventory) {
                    const item = engine.world.items.get(itemId);
                    if (item) {
                        engine.printLine(`- ${item.name}`);
                    }
                }
            });
            this.registerCommand('i', (args, engine) => {
                engine.world.commands.get('inventory')(args, engine);
            });

            // Use command
            this.registerCommand('use', (args, engine) => {
                if (args.length === 0) {
                    engine.printLine('Use what?');
                    return;
                }
                
                // Check for "on" keyword
                const onIndex = args.findIndex(arg => arg === 'on');
                let targetName = null;
                let itemName;
                
                if (onIndex !== -1) {
                    itemName = args.slice(0, onIndex).join(' ').toLowerCase();
                    targetName = args.slice(onIndex + 1).join(' ').toLowerCase();
                } else {
                    itemName = args.join(' ').toLowerCase();
                }
                
                // Find item in inventory
                let itemId = null;
                for (const id of engine.state.inventory) {
                    const item = engine.world.items.get(id);
                    if (item && item.name.toLowerCase().includes(itemName)) {
                        itemId = id;
                        break;
                    }
                }
                
                if (!itemId) {
                    engine.printLine("You don't have that item.");
                    return;
                }
                
                if (targetName) {
                    // Find target in room or inventory
                    const room = engine.world.rooms.get(engine.state.currentRoom);
                    let targetId = null;
                    
                    // Check room items
                    if (room && room.items) {
                        for (const id of room.items) {
                            const item = engine.world.items.get(id);
                            if (item && item.name.toLowerCase().includes(targetName)) {
                                targetId = id;
                                break;
                            }
                        }
                    }
                    
                    // Check room characters
                    if (!targetId && room && room.characters) {
                        for (const id of room.characters) {
                            const character = engine.world.characters.get(id);
                            if (character && character.name.toLowerCase().includes(targetName)) {
                                targetId = id;
                                break;
                            }
                        }
                    }
                    
                    // Check inventory
                    if (!targetId) {
                        for (const id of engine.state.inventory) {
                            const item = engine.world.items.get(id);
                            if (item && item.name.toLowerCase().includes(targetName)) {
                                targetId = id;
                                break;
                            }
                        }
                    }
                    
                    if (targetId) {
                        engine.useItem(itemId, targetId);
                    } else {
                        engine.printLine("You don't see that here.");
                    }
                } else {
                    engine.useItem(itemId);
                }
            });

            // Talk command
            this.registerCommand('talk', (args, engine) => {
                if (args.length === 0) {
                    engine.printLine('Talk to whom?');
                    return;
                }
                
                const room = engine.world.rooms.get(engine.state.currentRoom);
                if (!room || !room.characters) {
                    engine.printLine("There's no one here to talk to.");
                    return;
                }
                
                // Find character by name
                const charName = args.join(' ').toLowerCase();
                let characterId = null;
                
                for (const id of room.characters) {
                    const character = engine.world.characters.get(id);
                    if (character && character.name.toLowerCase().includes(charName)) {
                        characterId = id;
                        break;
                    }
                }
                
                if (characterId) {
                    const character = engine.world.characters.get(characterId);
                    if (character.talk) {
                        character.talk(engine.state, engine);
                    } else {
                        engine.printLine(`${character.name} has nothing to say to you.`);
                    }
                } else {
                    engine.printLine("You don't see that person here.");
                }
            });

            // Save command
            this.registerCommand('save', (args, engine) => {
                const slot = args.length > 0 ? args[0] : 'default';
                engine.saveGame(slot);
            });

            // Load command
            this.registerCommand('load', (args, engine) => {
                const slot = args.length > 0 ? args[0] : 'default';
                engine.loadGame(slot);
            });

            // Restart command
            this.registerCommand('restart', (args, engine) => {
                engine.restartGame();
            });

            // Quit command
            this.registerCommand('quit', (args, engine) => {
                engine.printLine('{{green}}Goodbye!{{color_reset}}');
                if (engine.env === 'node') {
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
            });
        }

        // Novel loading
        async loadNovel(novel) {
            try {
                // If novel is a URL, fetch it
                if (typeof novel === 'string' && (novel.startsWith('http://') || novel.startsWith('https://'))) {
                    if (this.env === 'browser') {
                        const response = await fetch(novel);
                        novel = await response.json();
                    } else {
                        const https = require('https');
                        novel = await new Promise((resolve, reject) => {
                            https.get(novel, (response) => {
                                let data = '';
                                response.on('data', (chunk) => data += chunk);
                                response.on('end', () => resolve(JSON.parse(data)));
                            }).on('error', reject);
                        });
                    }
                }
                
                // If novel is a string, parse as JSON
                if (typeof novel === 'string') {
                    novel = JSON.parse(novel);
                }
                
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
                }
                
                this.printLine(`Novel loaded: ${novel.title || 'Untitled'}`);
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

    return LOREEngine;
}));