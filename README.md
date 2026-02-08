Cadence (`ipm-cadence`)

Displays a rotating schedule based on day of week.

**Features:**
- Shows today's activity in large text
- Shows tomorrow's activity in smaller text
- Automatically cycles through multi-week schedules
- Persists position across sessions

**Config:**

```json
{
  "name": "ipm-cadence",
  "width": 1,
  "height": 2,
  "x": 0,
  "y": 0,
  "config": {
    "schedule": [
      {"dayOfWeek": "Monday", "data": "Chest"},
      {"dayOfWeek": "Wednesday", "data": "Back"},
      {"dayOfWeek": "Friday", "data": "Lower Body"},
      {"dayOfWeek": "Monday", "data": "Shoulder"},
      {"dayOfWeek": "Wednesday", "data": "Full Body"},
      {"dayOfWeek": "Friday", "data": "Arms"}
    ]
  }
}
```

**Properties:**
- `schedule` - Array of schedule items
    - `dayOfWeek` - Day name (e.g., "Monday", "Tuesday")
    - `data` - Text to display for that day

**How it works:**
- The schedule can repeat multiple times for the same day of week
- The module tracks which iteration you're on and cycles through
- If today doesn't match any schedule entry, shows "—"
- Tomorrow shows the next matching entry in the schedule