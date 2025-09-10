const { ANSI_COLORS, ANSI_STYLES } = require("./constants/ANSI");
const { VERSION, STORAGE_KEY, DEFAULT_PROMPT, DEFAULT_THEME, DEFAULT_CONFIG } = require("./constants/Defaults");
const Utils = require("./core/Utils");
const Game = require("./core/Game");

(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    global.LORE = factory();
  }
})(typeof window !== "undefined" ? window : this, function () {
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
