import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatSprintTitle,
  nextSprintId,
  sprintTitleEditablePart,
} from './sprintIds.js'

describe('sprintIds', () => {
  it('nextSprintId returns max+1', () => {
    assert.equal(nextSprintId([{ id: '1' }, { id: '3' }]), '4')
    assert.equal(nextSprintId([]), '1')
  })

  it('formatSprintTitle adds hash prefix', () => {
    assert.equal(formatSprintTitle('3', 'basalt arena (front)'), '#3 basalt arena (front)')
    assert.equal(formatSprintTitle('3', ''), '#3')
  })

  it('sprintTitleEditablePart strips prefix', () => {
    assert.equal(sprintTitleEditablePart('#3 basalt arena (front)', '3'), 'basalt arena (front)')
    assert.equal(sprintTitleEditablePart('Спринт #2 BASALT', '2'), 'BASALT')
  })
})
