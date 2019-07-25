const Express = require('express')
const Request = require('request-promise')

const App = Express()

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'
}

App.get('/', async (req, res) => {
  const options = {
    json: true,
    gzip: true,
    method: 'POST',
    qs: { time: new Date().getTime() },
    uri: 'https://bff-site.maxmilhas.com.br/search',
    headers: {
      ...headers,
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: {
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
  }

  try {
    const data = await Request(options)
    const gol = await searchFlights(data.id, 'gol')
    const azul = await searchFlights(data.id, 'azul')
    const latam = await searchFlights(data.id, 'latam')

    let pricing = [
      ...reduceToPrice(gol),
      ...reduceToPrice(azul),
      ...reduceToPrice(latam)
    ]

    pricing = pricing.sort((a, b) => {
      const { saleTotal: aPricing } = a.pricing
      const { saleTotal: bPricing } = b.pricing

      if (aPricing > bPricing) return 1
      if (aPricing < bPricing) return -1
      return 0
    })
  
    res.status(200).send({ pricing })
  } catch (error) {
    res.status(500).send({ error })
  }
})

function searchFlights (id, airline) {
  const options = {
    headers,
    gzip: true,
    json: true,
    qs: { airline },
    uri: `https://bff-site.maxmilhas.com.br/search/${id}/flights`,
  }

  return Request(options)
}

function reduceToPrice (flights) {
  return flights.outbound
    .map(item => ({
      airline: item.airline,
      pricing: item.pricing.airline
    }))
    .filter(item => !!item.pricing)
}

App.listen(4000, () => {
  console.log('Running on 4000')
})