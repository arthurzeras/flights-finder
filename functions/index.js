const Run = require('./base')
const Functions = require('firebase-functions')

exports.flightsFinderRobot = Functions.pubsub.schedule('every 1 hours')
  .onRun(async () => {
    try {
      await Run({ ...Functions.config() })

      const message = {
        message: `Finished new search at: ${new Date()}`
      }

      console.log(message)
      return JSON.stringify(message)
    } catch (error) {
      console.log(error)
      return JSON.stringify(error)
    }
  })
