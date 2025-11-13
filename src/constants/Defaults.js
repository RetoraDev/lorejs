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

module.exports = { VERSION, STORAGE_KEY, DEFAULT_PROMPT, DEFAULT_THEME, DEFAULT_CONFIG };
