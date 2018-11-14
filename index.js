// Import the scrape module
const coasterSearch = require('./src/scrape_1')
// Filesystem for reading/writing
const fs = require('fs')
// Line reader to read in the names of the roller coasters
var lineReader = require('readline').createInterface({
  input: fs.createReadStream('./data/rollercoasterdata.csv')
});

// Constants
const NUMPAGES = 38

// coasterSearch.exportCoasterRanks(NUMPAGES)

// Read in the data into an array and then get only the first column to compare
var names = []
let index = 0
let firstline = ''
lineReader.on('line', (line) => {
	if (index == 0) {
		firstline = line + ',Rank,Score'
	} else if (index < 300) {
		var cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
		names.push(cols)
	}
	index++
})

// Once file is finished being read, use the names to find rollercoaster matches
let rollercoastermatches = []
lineReader.on('close', () => {
	// Iterate through all pages to check for coasters
	let numFound = 0
	let numCompleted = NUMPAGES
	for (let i = 1; i <= NUMPAGES; i++) {
		coasterSearch.checkCoasters(i, names, (fulldata) => {
			numFound += Object.keys(fulldata).length
			console.log('NUMBER FOUND SO FAR: ' + numFound)
			// Now write the data in the array to a csv
			fulldata.forEach(function(element) {
				names[element['index']].push(element['rank'])
				names[element['index']].push(element['score'])
			})
			--numCompleted

			// Once all are done, make sure to perform file writing
			if (numCompleted == 0) {
				var logger = fs.createWriteStream('./data/trainingdata.csv', {
					flags: 'a'
				})

				// First write the top line
				logger.write(firstline + '\n')
				names.forEach(function(element) {
					if (element.length > 16) {
						logger.write(element.join(',') + '\n')
					}
				})

				logger.end()
			}
		})
	}
})
