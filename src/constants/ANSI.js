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

module.exports = { ANSI_COLORS, ANSI_STYLES };