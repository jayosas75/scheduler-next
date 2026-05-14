# Test Report: Drag & Drop Reschedule Logic
**Timestamp**: 5/14/2026, 1:41:04 AM
**Summary**: 6 passed, 2 failed

## Passed Tests
- ✓ Duration should be preserved when rescheduling a 1-hour event
- ✓ Duration should be preserved when rescheduling a 30-minute event
- ✓ New start hour should match the target drop hour
- ✓ New start minutes should be zeroed on drop
- ✓ PATCH request body shape should include id, start, end ISO strings
- ✓ Multi-hour event duration (2h) should be preserved after reschedule

## Failed Tests
- ✗ Dropping on same hour and same day should return null (no-op)
  > Expected null, got {"newStart":"2026-05-13T17:00:00.000Z","newEnd":"2026-05-13T18:00:00.000Z","duration":3600000}
- ✗ Rescheduling to a different day should use the selectedDate date
  > Expected truthy, got null
