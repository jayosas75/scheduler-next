# Test Report: Drag & Drop Reschedule Logic
**Timestamp**: 5/14/2026, 1:42:10 AM
**Summary**: 8 passed, 0 failed

## Passed Tests
- ✓ Duration should be preserved when rescheduling a 1-hour event
- ✓ Duration should be preserved when rescheduling a 30-minute event
- ✓ New start hour should match the target drop hour
- ✓ New start minutes should be zeroed on drop
- ✓ Dropping on same hour and same day should return null (no-op)
- ✓ Rescheduling to a different day should use the selectedDate date
- ✓ PATCH request body shape should include id, start, end ISO strings
- ✓ Multi-hour event duration (2h) should be preserved after reschedule

