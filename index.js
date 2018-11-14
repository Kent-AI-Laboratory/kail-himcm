// Import the scrape module
const coasterSearch = require('./src/scrape_1')
// Line reader to read in the names of the roller coasters
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('./data/rollercoasterdata.csv')
});

// Constants
const NUMPAGES = 38

// coasterSearch.exportCoasterRanks(NUMPAGES)

// Read in the data into an array and then get only the first column to compare
let names = []
let index = 0
lineReader.on('line', (line) => {
	if (index > 0 && index < 300) {
		let cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
		names.push({
			'name': cols[0],
			'park': cols[1],
			'country': cols[4]
		})
	}
	index++
})

// Once file is finished being read, use the names to find rollercoaster matches
let rollercoastermatches = []
lineReader.on('close', () => {
	// Iterate through all pages to check for coasters
	let numFound = 0
	for (let i = 1; i <= NUMPAGES; i++) {
		coasterSearch.checkCoasters(i, names, (fulldata) => {
			numFound += Object.keys(fulldata).length
			console.log('NUMBER FOUND SO FAR: ' + numFound)
			// Add all coasters found in fulldata to the matches array
			rollercoastermatches.concat(fulldata)
		})
	}
})

// Go back through array and filter out those whose locations do not match
