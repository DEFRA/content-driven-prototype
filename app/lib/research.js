/**
 * The research participant the facilitator described in the footer's
 * "Participant details" box (session key `researchParticipant`, see
 * app/routes/research.js). Hooks use it to put the participant's own name
 * and organisation where the prototype would otherwise make one up: blank
 * strings when nothing was given, so a hook can fall back to its stand-in.
 *
 *   const { participantOf } = require('../research')
 *   const { fullName } = participantOf(ctx.data)
 */
function participantOf(data) {
  const given = (data && data.researchParticipant) || {}
  const firstName = String(given.firstName || '').trim()
  const lastName = String(given.lastName || '').trim()
  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    organisation: String(given.organisation || '').trim()
  }
}

module.exports = { participantOf }
