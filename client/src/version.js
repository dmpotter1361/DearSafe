// Single source of truth for the displayed app version (kept in sync with package.json).
import pkg from '../package.json';

export const APP_VERSION = pkg.version;
