// Netlify Function wrapper for the /api/spotidown handler
const { wrap } = require('./_adapter.js');
const handler = require('../api/spotidown.js');
module.exports = { handler: wrap(handler) };
