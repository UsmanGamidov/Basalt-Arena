import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { solutionMatchesSearch } from './adminSolutions.js'

describe('solutionMatchesSearch', () => {
  const row = {
    handle: 'ace',
    sprintTitle: 'Backend',
    sprintId: 's3',
  }

  it('matches empty query', () => {
    assert.equal(solutionMatchesSearch(row, ''), true)
  })

  it('matches sprint id', () => {
    assert.equal(solutionMatchesSearch(row, 's3'), true)
    assert.equal(solutionMatchesSearch(row, 's9'), false)
  })
})
