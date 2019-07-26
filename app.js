require('dotenv').config()
const Cors = require('cors')
const Express = require('express')
const Run = require('./functions/base')

const App = Express()
App.use(Cors())

App.get('/', async (req, res) => {
  try {
    await Run({
      sendgrid: {
        emails: process.env.SENDGRID_EMAILS,
        apikey: process.env.SENDGRID_API_KEY
      }
    })

    res.status(200).send({ message: 'Finished with success' })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error })
  }
})

App.listen(4000, () => {
  console.log('Running on port 4000')
})