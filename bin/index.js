#!/usr/bin/env node

const { loadFlat, randomSolution, scoreEnvironment, scoreNeighbours, cachedScore } = require('../lib/permaculture')
const { walkabout, output, mutate, crossover, neighbours, scoreSeries, randomSeries, randomGeneration, nextGeneration, evolve, refold } = require('../lib/util')
const _ = require('lodash')

const run = async (dir) => {
  const data = await loadFlat(dir)
  const { width, height, size, types, terrain, light, preferences, neighbours } = data
  const score = cachedScore(data)
  let topScore = 0
  const cb = (solution) => {
    const s = score(solution)
    if (s > topScore) {
      console.log(`Best score: ${s}`)
      topScore = s
    }
  }
  const result = evolve(types, size, score, cb, 10000, 100, 0.05)
  const best = refold(result[0], { rows: width, columns: height })
  console.log(`Winning score: ${score(result[0])}`)
  console.log(output(best))
  return 'done'
}

// loadFlat('game').then((o) => JSON.stringify(o, undefined, 2)).then(console.log).catch(console.log)
run('game').then(console.log).catch(console.log)
