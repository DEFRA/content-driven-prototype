/**
 * Mock sign in for the shared GOV.UK One Login and Government Gateway pages
 * (content/shared/one-login/, content/shared/government-gateway/). Any
 * email, user ID and password are accepted: signing in, or finishing
 * creating sign in details, puts a mock `account` in the session, and the
 * sign-out route takes it away again.
 *
 * Spread the hooks into a journey's own (app/lib/<journey>/hooks.js):
 *
 *   const { mockSignIn } = require('../mock-sign-in')
 *   module.exports = { ...mockSignIn(), 'check-your-answers': … }
 *
 * and in its journey.yaml set `signedIn: { key: account, isSet: true }`, so
 * the header shows Sign out once the account is there. Hooks for a sign-in
 * page the journey does not list are ignored.
 *
 * The account: { email, fullName, organisation }. The name is the one typed
 * on the Government Gateway name page, else the research participant's
 * (see app/lib/research.js), else a stand-in. Options:
 *   account(account, data)  → the account to keep, to add what the journey
 *                             needs (an account type picked from the email,
 *                             say). `actingFor` and `changeActingFor` (a
 *                             page id) show who an agent acts for under the
 *                             banner (journey-engine/_signed-in-bar.html)
 *   clears                  more session keys to forget on sign out
 *   signOutTo               page id to land on after signing out (start)
 */

const { participantOf } = require('./research')

const STAND_IN_NAME = 'Sam Smith'

// Everything the sign-in pages remember, forgotten on sign out
const SIGN_IN_KEYS = [
  'account',
  'signInEmail',
  'mobileNumber',
  'securityCodeMethod',
  'governmentGatewayName',
  'governmentGatewayUserId'
]

/**
 * A Government Gateway user ID: 12 digits shown in pairs ("43 93 78 15 57 40")
 */
function mintGatewayUserId() {
  const digits = []
  for (let i = 0; i < 12; i += 1) {
    digits.push(Math.floor(Math.random() * 10))
  }
  return digits.join('').match(/\d{2}/g).join(' ')
}

function mockSignIn(options = {}) {
  const customise = options.account || ((account) => account)
  const clears = SIGN_IN_KEYS.concat(options.clears || [])
  const signOutTo = options.signOutTo || 'start'

  function signIn(data, email, name) {
    const participant = participantOf(data)
    const account = {
      email: String(email || '').trim(),
      fullName:
        String(name || '').trim() || participant.fullName || STAND_IN_NAME,
      organisation: participant.organisation || undefined
    }
    data.account = customise(account, data) || account
  }

  return {
    routes(router, journey) {
      const routes = { SIGN_OUT: `${journey.basePath}/sign-out` }
      router.get(routes.SIGN_OUT, (req, res) => {
        const data = (req.session && req.session.data) || {}
        for (const key of clears) {
          delete data[key]
        }
        res.redirect(`${journey.basePath}/${signOutTo}`)
      })
      return routes
    },

    // One Login: the email is the account; the password is never kept (the
    // field is named _password, so the kit does not store it either)
    'one-login-password': {
      process(ctx) {
        delete ctx.data._password
        signIn(ctx.data, ctx.data.signInEmail)
      }
    },
    'one-login-created': {
      process(ctx) {
        signIn(ctx.data, ctx.data.signInEmail)
      }
    },

    // Government Gateway: the user ID stands in for the email. Nothing typed
    // on the page is kept (remember: false), so it arrives as `value`, keyed
    // by the field name `_user-id` in camelCase
    'government-gateway-sign-in': {
      process(ctx, value) {
        signIn(ctx.data, (value && value._userId) || '')
      }
    },

    // The name box starts with the research participant's name, until the
    // participant types one. Only the page's copy of the data is filled in,
    // so nothing is kept until the form is submitted
    'government-gateway-name': {
      get(ctx, model) {
        const { data } = ctx
        const participant = participantOf(data)
        if (
          !ctx.preview &&
          !data.governmentGatewayName &&
          participant.fullName
        ) {
          model.data = { ...data, governmentGatewayName: participant.fullName }
        }
      }
    },

    // Creating sign in details ends on the user ID page: the ID is minted
    // when the page opens and Continue signs in under the name given
    'government-gateway-user-id': {
      load(ctx) {
        if (!ctx.preview && !ctx.data.governmentGatewayUserId) {
          ctx.data.governmentGatewayUserId = mintGatewayUserId()
        }
      },
      process(ctx) {
        const { data } = ctx
        signIn(data, data.signInEmail, data.governmentGatewayName)
      }
    }
  }
}

module.exports = { mockSignIn, SIGN_IN_KEYS, STAND_IN_NAME }
