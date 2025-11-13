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
