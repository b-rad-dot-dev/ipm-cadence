// Algorithm:
// Process this.schedule to find the maximum number of times a given dayOfWeek appears
// (this determines the cadence interval, e.g. 1 week, 2 weeks, etc...)
// and call this <cadenceInterval>
//
// Split this.schedule into <cadenceInterval> arrays (size 7 to make the next part easy)
// Get the <week of year - 1> mod <cadenceInterval> to get the array chunk -> <cadenceIndex>
// Get the current day of week
//
// Current Event:
// scheduleChunks[cadenceIndex][dayOfWeek] = current event
//
// Next Event:
// If it's not the last day of the week, return the next day
// if dayOfWeek + 1 < 7
//   return scheduleChunks[cadenceIndex][dayOfWeek + 1]
//
// If it's the last day of the week, but not the last cadence interval chunk, move to the next cadence
// interval chunk and reset the day back to the start of the week
// else if cadenceIndex + 1 < cadenceInterval
//   return scheduleChunks[cadenceIndex + 1][0]
//
// If it IS the last day of the week and it IS the last cadence interval chunk, go back to the beginning
// else
//   return scheduleChunks[0][0]

class IpmCadenceModule {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.schedule = config.schedule || [];
    this.init();
  }

  async init() {
    const response = await fetch('/modules/ipm-cadence/module.html');
    const html = await response.text();
    this.container.innerHTML = html;

    this.todayValue = this.container.querySelector('.today-value');
    this.tomorrowValue = this.container.querySelector('.tomorrow-value');

    this.updateDisplay();

    // Update at midnight
    this.scheduleNextUpdate();
  }

  scheduleNextUpdate() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow - now;

    setTimeout(() => {
      this.updateDisplay();
      this.scheduleNextUpdate();
    }, msUntilMidnight);
  }

  getWeekOfYear(date) {
    // ISO 8601 week number calculation
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Thursday of the current week
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  calculateCadenceInterval() {
    // Count occurrences of each day of week at each position
    const dayOfWeekMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const dayPositions = {}; // { 'Monday': [0, 2, 5], 'Tuesday': [1, 3] }

    this.schedule.forEach((item, index) => {
      const day = item.dayOfWeek;
      if (!dayPositions[day]) {
        dayPositions[day] = [];
      }
      dayPositions[day].push(index);
    });

    // Find the maximum occurrences of any single day
    let maxOccurrences = 0;
    for (const day in dayPositions) {
      maxOccurrences = Math.max(maxOccurrences, dayPositions[day].length);
    }

    // The cadence interval is the max occurrences of any day
    return maxOccurrences || 1;
  }

  buildScheduleChunks() {
    const cadenceInterval = this.calculateCadenceInterval();
    const scheduleChunks = [];

    // Initialize chunks with empty arrays of size 7 (one for each day of week)
    for (let i = 0; i < cadenceInterval; i++) {
      scheduleChunks.push(new Array(7).fill(null));
    }

    // Map day names to indices
    const dayOfWeekMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    // Track which occurrence we're on for each day
    const dayOccurrenceCount = {};

    // Fill in the schedule chunks
    this.schedule.forEach((item) => {
      const dayIndex = dayOfWeekMap[item.dayOfWeek];

      if (!dayOccurrenceCount[item.dayOfWeek]) {
        dayOccurrenceCount[item.dayOfWeek] = 0;
      }

      const chunkIndex = dayOccurrenceCount[item.dayOfWeek];
      scheduleChunks[chunkIndex][dayIndex] = item.data;

      dayOccurrenceCount[item.dayOfWeek]++;
    });

    return { scheduleChunks, cadenceInterval };
  }

  getCurrentEvent() {
    if (this.schedule.length === 0) return null;

    const { scheduleChunks, cadenceInterval } = this.buildScheduleChunks();
    const now = new Date();
    const weekOfYear = this.getWeekOfYear(now);
    const cadenceIndex = (weekOfYear - 1) % cadenceInterval;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    return scheduleChunks[cadenceIndex][dayOfWeek];
  }

  getNextEvent() {
    if (this.schedule.length === 0) return null;

    const { scheduleChunks, cadenceInterval } = this.buildScheduleChunks();
    const now = new Date();
    const weekOfYear = this.getWeekOfYear(now);
    const cadenceIndex = (weekOfYear - 1) % cadenceInterval;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // If it's not the last day of the week, return the next day
    if (dayOfWeek + 1 < 7) {
      return scheduleChunks[cadenceIndex][dayOfWeek + 1];
    }
    // If it's the last day of the week, but not the last cadence interval chunk
    else if (cadenceIndex + 1 < cadenceInterval) {
      return scheduleChunks[cadenceIndex + 1][0];
    }
    // If it IS the last day of the week and it IS the last cadence interval chunk
    else {
      return scheduleChunks[0][0];
    }
  }

  updateDisplay() {
    const current = this.getCurrentEvent();
    const next = this.getNextEvent();

    // Update today
    if (current) {
      this.todayValue.textContent = current;
      this.todayValue.classList.remove('none');
    } else {
      this.todayValue.textContent = '—';
      this.todayValue.classList.add('none');
    }

    // Update tomorrow
    if (next) {
      this.tomorrowValue.textContent = next;
      this.tomorrowValue.classList.remove('none');
    } else {
      this.tomorrowValue.textContent = '—';
      this.tomorrowValue.classList.add('none');
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

window.IpmCadenceModule = IpmCadenceModule;