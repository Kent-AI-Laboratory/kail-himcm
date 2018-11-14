// Require request for scraping
const request = require('request')
// Require cheerio for page navigation
const cheerio = require('cheerio')
// Require plotly for plotting data
const plotly = require('plotly')('evankirkiles', 'bGlDmLE1U2Ac8jDw5RmP')
	
// Constants
const BASEURL = 'https://captaincoaster.com/en/ranking/coasters?filters%5Bcontinent%5D&filters%5BmaterialType%5D&page='

// Function which builds a csv of the data of all the rollercoasters
module.exports.exportCoasterRanks = function exportCoasterRanks(pages) {
	// Array of all the ranks
	let scores = []
	let ranks = []
	let names = []
	let callsRemaining = pages
	// Iterate through the pages and pull the ranks
	for (let page = 1; page <= pages; page++) {
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
			$('ul[class="media-list content-group"]').find('li').each(function(i, element) {
				let data = {};
				// Manipulate the string to build an object containing all data
				$(element).find('h2 > a').each(function(i, subelement) {
					let parts = $(subelement).text().trim().split("-")
					data['rank'] = parseInt(parts[0].trim())
					data['name'] = parts[1].trim()
				})
				$(element).find('h3').each(function(i, subelement) {
					data['score'] = parseFloat($(subelement).text().trim().replace(",", ".").replace("%", ""))
				})

				// Print out the data for debugging purposes
				if (data['rank'] && data['name'] && data['score']) {
					scores.push(data['score'])
					ranks.push(data['rank'])
					names.push(data['name'])
				}
			})

			// Decrement callsremaining
			--callsRemaining
			// Perform writing here if all records acquired
			if (callsRemaining <= 0) {
				// Display distribution of ranks
				var trace1 = [{
					x: scores,
					y: ranks,
					name: 'Roller Coasters',
					text: names,
					mode: 'markers',
					type: 'scatter'
				}]
				var graphOptions = {filename: 'scoresonly', fileopt: 'overwrite'}
				plotly.plot(trace1, graphOptions, function (err, msg) {
					console.log(msg)
				})
			}
		})
	}
}

// Build a list of all the rollercoasters on a page, checking against the list of names for each one
// and discarding those not found in the list of rollercoasters.
module.exports.checkCoasters = function checkCoasters(page, names, callback) {
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
		let fulldata = []
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
			$(element).find('ul > li').each(function(i, subelement) {
				switch(i) {
					case 0: 
						data['park'] = $(subelement).text().trim()
						break
					case 1:
						data['country'] = $(subelement).text().trim()
						break
					default:
						break
				}
			})

			// Print out the data for debugging purposes
			if (data['rank'] && data['name'] && data['score']) {
				// Find coasters whose names are the exact same (need to expand upon this to become more encompassing (maybe use find?))
				let foundPark = names.findIndex(function(element) {
					if (element[0] == data['name']) {
						// For data found, run a quick check on the park and country 
						if (!element[1].replace(" ", "").replace(".", "").toUpperCase().includes(data['park'].replace(" ", "").replace(".", "").toUpperCase())) {
							console.log('Park for ' + data['name'] + ', "' + data['park'] + '", does not match data park "' + element[1] + '"')
						} else if (!element[4].replace(" ", "").replace(".", "").toUpperCase().includes(data['country'].replace(" ", "").replace(".", "").toUpperCase())) {
							console.log('Country for ' + data['name'] + ', "' + data['country'] + '", does not match data park "' + element[4] + '"')
						} else {
							return true
						}
					}
				})

				if (foundPark != -1) {
					data['index'] = foundPark
					fulldata.push(data)
					// console.log(data['rank'] + ': ' + data['name'] + ', ' + data['score'])
				}
			}
		})

		// Return the full data once it is filled
		callback(fulldata)
	})
}
