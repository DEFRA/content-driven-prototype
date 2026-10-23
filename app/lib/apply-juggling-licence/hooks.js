/**
 * Bespoke behaviour for the example juggling licence journey. Every key is
 * a page id from content/apply-juggling-licence/journey.yaml; see the top of
 * app/lib/journey-engine/router.js for the hooks a page can have.
 */

const { participantOf } = require('../research')

// The name box starts with the participant's name when the facilitator gave
// it in the footer's Participant details box. Only the page's copy of the
// answers changes; nothing is saved until the user continues.
const yourDetails = {
  get(ctx, model) {
    const { data } = ctx
    const participant = participantOf(data)
    if (!ctx.preview && !data.applicantDetails && participant.fullName) {
      model.data = {
        ...data,
        applicantDetails: { fullName: participant.fullName }
      }
    }
  }
}

// Accepting the answers makes a reference for the confirmation and email
const checkYourAnswers = {
  process(ctx) {
    const suffix = Date.now().toString().slice(-6)
    ctx.data.applicationReference = `JL-${suffix}`
  }
}

module.exports = {
  'your-details': yourDetails,
  'check-your-answers': checkYourAnswers
}
