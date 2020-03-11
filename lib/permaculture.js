const _ = require('lodash')
const { loadMatrix, loadObjects, getElement, getSize, walkabout, mutate, refold, output, crossover, randomSeries, randomGeneration, neighbours, scoreSeries } = require('./util')
const debug = true

const load = async (dir) => {
  return Promise.all([
    loadMatrix(`${dir}/terrain.csv`),
    loadMatrix(`${dir}/light.csv`),
    loadObjects(`${dir}/preferences.csv`),
    loadObjects(`${dir}/neighbours.csv`)
  ])
    .then(
      (result) => _.zipObject(['terrain', 'light', 'preferences', 'neighbours'], result)
    )
}

const loadFlat = async (dir) => {
  const { terrain, light, preferences, neighbours } = await load(dir)
  return {
    width: terrain[0].length,
    height: terrain.length,
    size: terrain[0].length * terrain.length,
    types: _.keys(preferences),
    terrain: _.flatten(terrain),
    light: _.flatten(light),
    preferences,
    neighbours
  }
}

const scoreSolution = ({ preferences, maps, neighbours, width }) => {
  return (solution) => {
    const diversity = Math.pow(_.uniq(solution).length, 2)
    return diversity + scoreEnvironment(solution, preferences, maps) + scoreNeighbours(solution, neighbours, width)
  }
}

const cachedScore = (params) => {
  const cache = {}
  const score = scoreSolution(params)
  return (solution) => {
    const key = solution.join('')
    const cached = cache[key]
    if (cached !== undefined) {
      return cached
    } else {
      const s = score(solution)
      cache[key] = s
      return s
    }
  }
}

/*
 * Note: there are not negative penalties (yet)
 */
const scoreEnvironment = (solution, preferences, maps) => {
  return _.reduce(maps, (sum, map, mapName) => {
    return sum + solution.reduce((subsum, val, i) => {
      if (preferences[val][mapName] === map[i]) {
        if (debug) console.log(`${val} likes ${map[i]}`)
        return subsum + 2
      } else {
        return subsum - 2
      }
    }, 0)
  }, 0)
}

const scoreNeighbours = (solution, neighbours, width) => {
  const score = (a, b) => parseFloat(neighbours[a][b])
  return scoreSeries(solution, score, width)
}

module.exports = { load, loadFlat, scoreEnvironment, scoreNeighbours, cachedScore }
