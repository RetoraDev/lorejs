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

const fs = require('fs');
const path = require('path');
const terser = require('./lib/terser.js');

// Colors
const red = '\x1b[31m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

// Configuration
const SRC_DIR = 'src';
const ENTRY_FILE = path.join(SRC_DIR, 'main.js');
const OUTPUT_FILE = 'lore.js';
const MINIFIED_FILE = 'lore.min.js';
const LICENSE_HEADER = `/**
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
*/`;

// Track processed files to avoid duplicates and cycles
const processedFiles = new Set();

// Extract require statements from code
function extractRequires(code) {
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const requires = [];
  let match;
  
  while ((match = requireRegex.exec(code)) !== null) {
    match[1].startsWith('.') && requires.push(match[1]);
  }
  
  return requires;
}

// Resolve a module path relative to the current file
function resolveModule(modulePath, currentFile) {
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    return path.resolve(path.dirname(currentFile), modulePath) + '.js';
  }
  return path.join(SRC_DIR, modulePath) + '.js';
}

// Process a file and its dependencies in correct order
function processFile(filePath, indentation = 0) {
  if (processedFiles.has(filePath)) {
    return '';
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  processedFiles.add(filePath);
  
  let code = fs.readFileSync(filePath, 'utf8');
  const requires = extractRequires(code);
  
  // Process dependencies first
  let dependencyCode = '';
  for (const req of requires) {
    const resolvedPath = resolveModule(req, filePath);
    dependencyCode += processFile(resolvedPath, indentation);
  }
  
  // Remove module.exports and require statements if not marked with @allow node
  if (!code.includes('@allow node')) {
    code = code.replace(/module\.exports\s*=\s*{[^}]*};/g, '');
    code = code.replace(/module\.exports\s*=\s*[^;]*;/g, '');
    code = code.replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);/g, '');
    code = code.replace(/const\s+[^=]+\s*=\s*require\([^)]+\);/g, '');
    code = code.replace(/require\([^)]+\);/g, '');
  }
  
  // Clean up extra whitespace and newlines
  code = code
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .trim();
  
  // Apply indentation
  const indent = ' '.repeat(indentation);
  code = code.split('\n')
    .map(line => line.trim() ? indent + line : '') // Only indent non-empty lines
    .filter(line => line !== '') // Remove empty lines
    .join('\n');
  
  // Combine dependency code and current file code with proper spacing
  let result = '';
  if (dependencyCode) {
    result += dependencyCode + '\n';
  }
  result += `\n\n` + code;
  
  return result;
}

// Extract the wrapper function from main.js
function extractWrapper(code) {
  const wrapperStart = code.indexOf('(function (global, factory) {');
  if (wrapperStart === -1) {
    throw new Error('Wrapper function not found in main.js');
  }
  
  const wrapperEnd = code.indexOf('});', wrapperStart);
  if (wrapperEnd === -1) {
    throw new Error('Wrapper function not properly closed in main.js');
  }
  
  return code.substring(wrapperStart, wrapperEnd + 3);
}

// Util to minify code with terser
async function minifyCode(code) {
  const minified = await terser.minify(code, {
    mangle: {
      toplevel: false,
      properties: false,
      keep_fnames: false,
      keep_classnames: false
    }
  });
  return LICENSE_HEADER + '\n\n' + minified.code;
}

// Util to convert bytes to a human readable size expression
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i < 0) return '0 B';
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// Build the output
async function build() {
  console.log('Building lore.js...');
  
  try {
    // Reset processed files
    processedFiles.clear();
    
    // Read the main file to extract the wrapper
    const mainCode = fs.readFileSync(ENTRY_FILE, 'utf8');
    const wrapper = extractWrapper(mainCode);
    
    // Find where to insert the code inside the wrapper
    const factoryStart = wrapper.indexOf('function () {');
    if (factoryStart === -1) {
      throw new Error('Factory function not found in wrapper');
    }
    
    const insertionPoint = factoryStart + 'function () {'.length;
    const wrapperStart = wrapper.substring(0, insertionPoint);
    const wrapperEnd = wrapper.substring(insertionPoint);
    
    // Process all files except main.js (we already extracted the wrapper)
    processedFiles.add(ENTRY_FILE);
    
    const requires = extractRequires(mainCode);
    let innerCode = '  ';
    
    for (const req of requires) {
      const resolvedPath = resolveModule(req, ENTRY_FILE);
      innerCode += processFile(resolvedPath, 2);
    }
    
    // Clean up inner code by removing excessive newlines
    innerCode = innerCode
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
      .trim();
    
    // Build the final output
    let outputCode = LICENSE_HEADER + '\n\n';
    outputCode += wrapperStart;
    outputCode += '\n  "use strict";\n\n  ';
    outputCode += innerCode;
    outputCode += '\n  '; // Ensure proper spacing before wrapper end
    outputCode += wrapperEnd;
    
    // Clean up final output by removing excessive new lines
    outputCode = outputCode.replace(/\n{3,}/g, '\n\n');
    
    // Write the regular version
    fs.writeFileSync(OUTPUT_FILE, outputCode);
    console.log(green + `✓ ${OUTPUT_FILE} built successfully (${formatBytes(outputCode.length)})` + reset);
    
    // Create minified version 
    const minifiedCode = await minifyCode(outputCode);
    
    if (minifiedCode) {
      fs.writeFileSync(MINIFIED_FILE, minifiedCode);
      console.log(green + `✓ ${MINIFIED_FILE} built successfully (${formatBytes(minifiedCode.length)})` + reset);
    }
    
    console.log('Build completed successfully!');
    
  } catch (error) {
    console.error(red + 'Build failed:', error.message + reset);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build, processFile, formatBytes };