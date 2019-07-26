const functions = require('firebase-functions')

exports.scheduledFunction = functions.pubsub
  .schedule('every 2 hours')
  .onRun(context => {
    console.log(`Running again at: ${new Date()}`)
  })
