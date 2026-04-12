#!/usr/bin/env node

/**
 * Centralized Logging System for Creative Rights Tracker
 * 
 * Usage:
 *   const logger = require('./logging');
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Database error', new Error('Connection failed'), { detail: 'timeout' });
 * 
 * Environment Variables:
 *   LOG_DIR - Directory to store logs (default: ./logs)
 *   LOG_LEVEL - Minimum log level: debug, info, warn, error (default: info)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log size threshold (10 MB)
const MAX_LOG_SIZE = 10 * 1024 * 1024;

/**
 * Creates a structured log entry with timestamp and metadata
 */
function createLogEntry(level, message, error = null, data = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...(error && {
      error: error.message || String(error),
      stack: error.stack || null
    }),
    ...(data && { data })
  };
  return JSON.stringify(entry);
}

/**
 * Appends log entry to file with rotation
 */
function appendLog(filename, logEntry) {
  const logPath = path.join(LOG_DIR, filename);
  
  try {
    // Check file size and rotate if necessary
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = Date.now();
        const rotatedPath = logPath.replace('.log', `.${timestamp}.log`);
        fs.renameSync(logPath, rotatedPath);
      }
    }
    
    // Append new log entry
    fs.appendFileSync(logPath, logEntry + '\n', { encoding: 'utf8' });
  } catch (err) {
    // Fallback: log to console if file write fails
    console.error(`Failed to write to ${logPath}:`, err.message);
  }
}

/**
 * Logger API
 */
const logger = {
  /**
   * Log general information
   * @param {string} message - Log message
   * @param {object} data - Structured data (optional)
   */
  info: (message, data) => {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.info) {
      const entry = createLogEntry('info', message, null, data);
      console.log(entry);
      appendLog('info.log', entry);
    }
  },

  /**
   * Log warnings
   * @param {string} message - Warning message
   * @param {object} data - Additional context
   */
  warn: (message, data) => {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.warn) {
      const entry = createLogEntry('warn', message, null, data);
      console.warn(entry);
      appendLog('warn.log', entry);
    }
  },

  /**
   * Log errors
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {object} data - Additional context
   */
  error: (message, error, data) => {
    if (LOG_LEVELS[LOG_LEVEL] <= LOG_LEVELS.error) {
      const entry = createLogEntry('error', message, error, data);
      console.error(entry);
      appendLog('error.log', entry);
    }
  },

  /**
   * Log debug information (only in debug mode)
   * @param {string} message - Debug message
   * @param {object} data - Debug data
   */
  debug: (message, data) => {
    if (LOG_LEVEL === 'debug') {
      const entry = createLogEntry('debug', message, null, data);
      console.log(entry);
      appendLog('debug.log', entry);
    }
  }
};

module.exports = logger;
