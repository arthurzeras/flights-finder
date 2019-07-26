const SGMail = require('@sendgrid/mail')
const Request = require('request-promise')

const PRICE_LIMIT = 500
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
let SENDGRID_EMAILS = []
let SENDGRID_API_KEY = null

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

async function run(env = {}) {
  if (!Object.keys(env).length) {
    return Promise.reject(
      new Error('No environment variables were entered')
    )
  }

  SENDGRID_EMAILS = env.sendgrid.emails
  SENDGRID_API_KEY = env.sendgrid.apikey

  if (!SENDGRID_EMAILS || !SENDGRID_API_KEY) {
    return Promise.reject(new Error('SendGrid variables are required'))
  }

  const { id, airlines: airlinesList } = await searchAirlinesFlighs()

  searchId = id

  const airlines = findAvailableFlights(airlinesList)

  if (!airlines.length) {
    return Promise.resolve({ message: 'No airlines found' })
  }

  let pricing = []

  for (let airline of airlines) {
    // eslint-disable-next-line no-await-in-loop
    const flights = await searchFlightsByAirline(airline)
    pricing = [...pricing, ...reduceToPrice(flights)]
  }

  pricing = pricing.filter(item => (
    item.pricing.saleTotal < PRICE_LIMIT
  ))

  if (pricing.length) {
    return await sendAltertMail(pricing)
  }

  return Promise.resolve()
}

module.exports = run