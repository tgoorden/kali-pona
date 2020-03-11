const fs = require('fs')
const Csv = require('csv-reader')
const _ = require('lodash')

const loadMatrix = (file) => new Promise((resolve, reject) => {
  const result = []
  fs.createReadStream(file, 'utf8')
    .pipe(new Csv({ parseBooleans: true }))
    .on('data', (row) => {
      result.push(row)
    })
    .on('end', (data) => {
      resolve(result)
    })
    .on('error', reject)
})

const loadObjects = (file) => new Promise((resolve, reject) => {
  const result = {}
  fs.createReadStream(file, 'utf8')
    .pipe(new Csv({ parseNumbers: true, asObject: true }))
    .on('data', (plant) => {
      result[plant.type] = plant
    })
    .on('end', (data) => {
      resolve(result)
    })
    .on('error', reject)
})

const getElement = (matrix, { row, col }) => matrix[row][col]

const getSize = (matrix) => {
  const size = {
    rows: matrix.length,
    columns: matrix[0].length,
    count: matrix.length * matrix[0].length
  }
  return size
}
/*
 * Calls the callback with every element in the matrix,
 * together with the location.
 */
const walkabout = (matrix, cb) => new Promise((resolve, reject) => {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      cb(value, { row: y, col: x })
    })
  })
  resolve()
})

const refold = (series, size) => {
  const rows = [...Array(size.rows).keys()]
  return rows.map((row) => _.slice(series, size.columns * row, size.columns * row + size.columns))
}
/**
 * Mutate elements within the matrix at the specified rate (% chance).
 * A mutation is a random selection from the allowed values, excluding
 * the previous value.
 */
const mutate = (matrix, values, rate = 0.05) => {
  return refold(mutateSeries(_.flatten(matrix), values, rate), getSize(matrix))
}

const mutateSeries = (series, values, rate = 0.05) => {
  return series.map((val) => {
    if (Math.random() < rate) {
      return _.sample(_.difference(values, [val]))
    } else {
      return val
    }
  })
}

const crossover = (A, B) => {
  const seriesA = _.flatten(A)
  const seriesB = _.flatten(B)
  return refold(crossoverSeries(seriesA, seriesB), getSize(A))
}

const crossoverSeries = (seriesA, seriesB) => {
  const slice = Math.floor(Math.random() * (seriesA.length - 1) + 1)
  return _.slice(seriesA, 0, slice).concat(_.slice(seriesB, slice))
}

const neighbours = (series, index, width) => {
  const result = []
  if (index - width > -1) result.push(series[index - width]) // up
  if ((index + 1) % width > 0) result.push(series[index + 1]) // right
  if (index + width < series.length) result.push(series[index + width]) // down
  if (index % width > 0) result.push(series[index - 1]) // left
  return result
}

const scoreSeries = (series, score, width) => {
  return series.reduce((sum, val, i) => {
    return sum + neighbours(series, i, width).reduce((subsum, neighbour) => subsum + score(val, neighbour), 0)
  }, 0)
}

/**
 * Create a random series (array) of values (types) of specified length.
 * */
const randomSeries = (types, length) => {
  return Array.from(Array(length), () => _.sample(types))
}
/*
 *
 */
const randomGeneration = (types, length, population) => {
  return Array.from(Array(population), () => randomSeries(types, length))
}

const nextGeneration = (gen, types, score, rate) => {
  const top = gen.slice(0, Math.floor(gen.length / 2)) // top half gets to procreate
  const next = Array.from(Array(gen.length - 1), () => mutateSeries(
    crossoverSeries(_.sample(top), _.sample(top)),
    types,
    rate)
  )
  next.push(gen[0])
  return _.reverse(_.sortBy(next, score))
}

const evolve = (types, length, score, callback = _.noop, generations = 100, population = 20, rate = 0.1) => {
  let gen = _.reverse(_.sortBy(randomGeneration(types, length, population), score))
  let counter = 0
  while (counter < generations) {
    callback(gen[0]) // the best solution is communicated
    gen = nextGeneration(gen, types, score, rate)
    counter++
  }
  return gen
}

const output = (matrix) => matrix.map((row) => row.join(',')).join('\n')

module.exports = { loadMatrix, loadObjects, getElement, getSize, walkabout, mutate, refold, output, crossover, randomSeries, neighbours, scoreSeries, randomGeneration, nextGeneration, evolve }
