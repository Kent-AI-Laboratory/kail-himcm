// Require request for scraping
const request = require('request')
// Require cheerio for page navigation
const cheerio = require('cheerio')
// Csv parser for reading in the csv of names


// Constants
const BASEURL = 'https://captaincoaster.com/en/ranking/coasters?filters%5Bcontinent%5D&filters%5BmaterialType%5D&page='

// First, retrieve the list of names from the excel spreadsheet using csv-parse	

// Build a list of all the rollercoasters on a page, checking against the list of names for each one
// and discarding those not found in the list of rollercoasters.
module.exports = function checkCoasters(page, names, callback) {
	request.get({
		url: BASEURL + page,
		headers: {
			'X-Requested-With':'XMLHttpRequest',
			'Accept':'text/html,*/*;q=0.01',
			'Accept-Language':'en-us'
		}
	}, (err, resp, body) => {
		// Ensure no errors
		if (err) { console.log('Error occurred at page ' + page + '! Aborting this coaster parse.'); return }

		// Now use Cheerio to parse through the body and get each coaster
		const $ = cheerio.load(body)
		let fulldata = {}
		$('ul[class="media-list content-group"]').find('li').each(function(i, element) {
			let data = {};
			// Manipulate the string to build an object containing all data
			$(element).find('h2 > a').each(function(i, subelement) {
				let parts = $(subelement).text().trim().split("-")
				data['rank'] = parts[0].trim()
				data['name'] = parts[1].trim()
			})
			$(element).find('h3').each(function(i, subelement) {
				data['score'] = $(subelement).text().trim().replace(",", ".").replace("%", "")
			})

			// Print out the data for debugging purposes
			if (data['rank'] && data['name'] && data['score']) {
				// Find coasters whose names are the exact same (need to expand upon this to become more encompassing (maybe use find?))
				if (names.indexOf(data['name']) != -1) {
					fulldata[data['name']] = data
					console.log(data['rank'] + ': ' + data['name'] + ', ' + data['score'])
				}
			}
		})

		// Return the full data once it is filled
		callback(fulldata)
	})
}
