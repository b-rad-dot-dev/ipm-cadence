class IpmCadence {
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

  getDayOfWeek() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  getTomorrowDayOfWeek() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return days[tomorrow.getDay()];
  }

  findCurrentEvent() {
    const today = this.getDayOfWeek();
    
    // Find all matching entries for today
    const matchingIndices = [];
    this.schedule.forEach((item, index) => {
      if (item.dayOfWeek === today) {
        matchingIndices.push(index);
      }
    });

    if (matchingIndices.length === 0) {
      return { currentIndex: -1, current: null };
    }

    // If there's only one match, use it
    if (matchingIndices.length === 1) {
      return { currentIndex: matchingIndices[0], current: this.schedule[matchingIndices[0]] };
    }

    // Multiple matches - need to figure out which one we're on in the cycle
    // Use localStorage to track position
    const lastIndexKey = 'day-schedule-last-index';
    const lastDateKey = 'day-schedule-last-date';
    const todayStr = new Date().toDateString();
    
    const lastIndex = parseInt(localStorage.getItem(lastIndexKey) || '-1');
    const lastDate = localStorage.getItem(lastDateKey);

    // If it's a new day, find the next matching index after the last one
    if (lastDate !== todayStr) {
      let nextIndex = -1;
      
      for (let i = 0; i < matchingIndices.length; i++) {
        if (matchingIndices[i] > lastIndex) {
          nextIndex = matchingIndices[i];
          break;
        }
      }
      
      // If we didn't find one after lastIndex, wrap to the first match
      if (nextIndex === -1) {
        nextIndex = matchingIndices[0];
      }

      localStorage.setItem(lastIndexKey, nextIndex.toString());
      localStorage.setItem(lastDateKey, todayStr);
      
      return { currentIndex: nextIndex, current: this.schedule[nextIndex] };
    }

    // Same day, return the stored index if it's still valid
    if (matchingIndices.includes(lastIndex)) {
      return { currentIndex: lastIndex, current: this.schedule[lastIndex] };
    }

    // Fallback to first match
    const index = matchingIndices[0];
    localStorage.setItem(lastIndexKey, index.toString());
    localStorage.setItem(lastDateKey, todayStr);
    return { currentIndex: index, current: this.schedule[index] };
  }

  findNextEvent(currentIndex) {
    if (this.schedule.length === 0) return null;
    if (currentIndex === -1) return null;

    const tomorrow = this.getTomorrowDayOfWeek();
    
    // Look for the next event in the schedule starting from currentIndex + 1
    for (let i = currentIndex + 1; i < this.schedule.length; i++) {
      if (this.schedule[i].dayOfWeek === tomorrow) {
        return this.schedule[i];
      }
    }

    // Wrap around to the beginning
    for (let i = 0; i <= currentIndex; i++) {
      if (this.schedule[i].dayOfWeek === tomorrow) {
        return this.schedule[i];
      }
    }

    return null;
  }

  updateDisplay() {
    const { currentIndex, current } = this.findCurrentEvent();
    const next = this.findNextEvent(currentIndex);

    // Update today
    if (current) {
      this.todayValue.textContent = current.data;
      this.todayValue.classList.remove('none');
    } else {
      this.todayValue.textContent = '—';
      this.todayValue.classList.add('none');
    }

    // Update tomorrow
    if (next) {
      this.tomorrowValue.textContent = next.data;
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

window.IpmCadence = IpmCadence;
