import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { submissionMatchesSearch } from './adminSubmissions.js'

describe('submissionMatchesSearch', () => {
  const row = {
    handle: 'fighter',
    email: 'f@x.dev',
    sprintTitle: 'Frontend',
    sprintId: 's2',
    status: 'pending_review',
    statusLabel: 'На проверке',
  }

  it('matches empty query', () => {
    assert.equal(submissionMatchesSearch(row, ''), true)
  })

  it('matches handle', () => {
    assert.equal(submissionMatchesSearch(row, 'fight'), true)
    assert.equal(submissionMatchesSearch(row, 'zzz'), false)
  })

  it('matches sprint title', () => {
    assert.equal(submissionMatchesSearch(row, 'front'), true)
  })
})
