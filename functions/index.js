const SGMail = require('@sendgrid/mail')
const Request = require('request-promise')
const Functions = require('firebase-functions')

const {
  emails: SENDGRID_EMAILS,
  apikey: SENDGRID_API_KEY
} = Functions.config().sendgrid

const PRICE_LIMIT = 1000
const BASE_URL = 'https://bff-site.maxmilhas.com.br'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
}
const FLIGHT_PARAMS = {
  adults: 1,
  to: 'BSB',
  infants: 0,
  cabin: 'EC',
  children: 0,
  from: 'BPS',
  tripType: 'OW',
  allowSearchSameDay: false,
  outboundDate: '2019-09-28'
}

let searchId = null

function searchAirlinesFlighs () {
  return Request({
    json: true,
    gzip: true,
    method: 'POST',
    body: FLIGHT_PARAMS,
    uri: `${BASE_URL}/search`,
    qs: { time: new Date().getTime() },
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

function findAvailableFlights (airlines) {
  return airlines
    .filter(airline => airline.status.enable)
    .map(airline => airline.label)
}

function searchFlightsByAirline (airline) {
  return Request({
    gzip: true,
    json: true,
    qs: { airline },
    headers: HEADERS,
    uri: `${BASE_URL}/search/${searchId}/flights`,
  })
}

function reduceToPrice (flights) {
  return flights.outbound
    .map(item => ({
      airline: item.airline,
      pricing: item.pricing.airline
    }))
    .filter(item => Boolean(item.pricing))
}

function sendAltertMail (flights) {
  SGMail.setApiKey(SENDGRID_API_KEY)

  flights = flights
    .map(item => `EMPRESA: ${item.airline} - Preço: ${item.pricing.saleTotal}`)
    .join('\n\n')
  
  const msg = {
    to: SENDGRID_EMAILS.split(','),
    from: SENDGRID_EMAILS.split(',')[0],
    subject: 'Nova passagem interessante...',
    text: `Dá uma olhada nessas passagem ai: \n\n ${flights}`
  }

  return SGMail.send(msg)
}

exports.flightsFinderRobot = Functions.pubsub.schedule('every 2 hours')
  .onRun(async () => {
    try {
      const { id, airlines: airlinesList } = await searchAirlinesFlighs()

      searchId = id

      const airlines = findAvailableFlights(airlinesList)

      if (!airlines.length) {
        return JSON.stringify({ message: 'No airlines found' })
      }

      airlines.map(async airline => {
        const flights = await searchFlightsByAirline(airline)
        return reduceToPrice(flights)
      })

      const pricing = airlines.filter(item => (
        item.pricing.saleTotal < PRICE_LIMIT
      ))

      await sendAltertMail(pricing)

      return JSON.stringify({
        message: `Finished new search at: ${new Date()}`
      })
    } catch (error) {
      return JSON.stringify({ error })
    }
  })
