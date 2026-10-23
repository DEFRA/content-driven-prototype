/**
 * Bespoke behaviour for the example staff journey: only the sign-out route
 * the header's Sign out link uses (`$signOut` in journey.yaml). The mock
 * sign in's One Login and Government Gateway hooks are ignored here, since
 * the journey lists none of those pages.
 */

const { mockSignIn } = require('../mock-sign-in')

module.exports = {
  ...mockSignIn({ clears: ['officer', 'decision'], signOutTo: 'sign-in' })
}
