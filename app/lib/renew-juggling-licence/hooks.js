/**
 * Bespoke behaviour for the example "Renew a juggling licence" journey: the
 * mock sign in (app/lib/mock-sign-in.js) and nothing else. Signing out also
 * forgets the renewal.
 */

const { mockSignIn } = require('../mock-sign-in')

module.exports = {
  ...mockSignIn({ clears: ['signInMethod', 'renewalLength'] })
}
