// 43-week marathon plan generator

// Long run progression by phase (miles)
const LONG_RUN_PROGRESSION = {
    phase1: [6, 7, 8, 6, 9, 10, 8, 11],  // Weeks 1-8
    phase2: [8, 12, 10, 13, 10, 14, 12, 15, 12, 16],  // Weeks 9-18
    phase3: [13, 17, 14, 18, 14, 18, 15, 19, 15, 20, 16, 18],  // Weeks 19-30
    phase4: [14, 20, 12, 20, 16, 18, 14, 20, 12, 16],  // Weeks 31-40
    phase5: [12, 8, 'RACE']  // Weeks 41-43
};

// Get week number from start date
function getWeekNumber(date, startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    
    const diffTime = current - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    
    return Math.max(1, Math.min(week, 43));
}

// Get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(date) {
    return new Date(date).getDay();
}

// Get date string (YYYY-MM-DD)
function getDateString(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Get long run distance for week
function getLongRunDistance(week) {
    if (week <= 8) {
        return LONG_RUN_PROGRESSION.phase1[week - 1];
    } else if (week <= 18) {
        return LONG_RUN_PROGRESSION.phase2[week - 9];
    } else if (week <= 30) {
        return LONG_RUN_PROGRESSION.phase3[week - 19];
    } else if (week <= 40) {
        return LONG_RUN_PROGRESSION.phase4[week - 31];
    } else {
        return LONG_RUN_PROGRESSION.phase5[week - 41];
    }
}

// Get quality run description for week
function getQualityRunDescription(week) {
    if (week <= 8) {
        return {
            type: 'easy',
            description: 'Easy run + 6x20s strides'
        };
    } else if (week <= 18) {
        const isEven = week % 2 === 0;
        return {
            type: isEven ? 'tempo' : 'hills',
            description: isEven 
                ? 'Tempo: 2x10 min (easy recovery)'
                : 'Hills: 8x30-45 sec (controlled)'
        };
    } else if (week <= 30) {
        const isEven = week % 2 === 0;
        return {
            type: isEven ? 'tempo' : 'intervals',
            description: isEven
                ? 'Tempo: 20-40 min total work'
                : 'Intervals: 5x3 min (controlled)'
        };
    } else if (week <= 40) {
        const isEven = week % 2 === 0;
        return {
            type: isEven ? 'mp' : 'intervals',
            description: isEven
                ? 'MP repeats: 3x2 miles @ MP effort'
                : '6x800m @ controlled hard'
        };
    } else {
        return {
            type: 'easy',
            description: 'Short MP pickups, low volume'
        };
    }
}

// Get easy run suggestion for week
function getEasyRunSuggestion(week) {
    if (week <= 8) {
        return { min: 20, max: 40 };
    } else if (week <= 18) {
        return { min: 30, max: 50 };
    } else if (week <= 30) {
        return { min: 35, max: 60 };
    } else if (week <= 40) {
        return { min: 30, max: 55 };
    } else {
        return { min: 20, max: 40 };
    }
}

// Get lift description for week
function getLiftDescription(week, liftType) {
    if (liftType === 'A') {
        if (week <= 18) {
            return {
                squat: '3x5',
                bench: '3x5',
                rdl: '2x6-8'
            };
        } else {
            return {
                squat: '1x5 + 1x5 @ ~90%',
                bench: 'Top set + 2 backoff sets',
                rdl: '2x6-8'
            };
        }
    } else { // Lift B
        return {
            deadlift: week <= 18 ? '1x5' : '2x3 (when heavy)',
            press: '3x5',
            stepDowns: '2x6 each leg (slow)',
            soleus: '2x15-20'
        };
    }
}

// Get today's prescribed activities
function getTodayItems(date, startDate, longRunDay = 'saturday') {
    if (!startDate) return [];
    
    const week = getWeekNumber(date, startDate);
    const dayOfWeek = getDayOfWeek(date);
    const items = [];
    
    // Determine long run day (0 = Sunday, 6 = Saturday)
    const longRunDayNum = longRunDay === 'sunday' ? 0 : 6;
    const easyDayAfterLong = longRunDay === 'sunday' ? 1 : 0; // Monday if Sat long run, Sunday if Sun long run
    
    // Runs (4 per week)
    if (dayOfWeek === 2) { // Tuesday - Quality
        const quality = getQualityRunDescription(week);
        items.push({
            kind: 'run',
            type: 'quality',
            label: `Quality Run: ${quality.description}`,
            week,
            day: 'tuesday'
        });
    } else if (dayOfWeek === 4) { // Thursday - Easy
        const easy = getEasyRunSuggestion(week);
        items.push({
            kind: 'run',
            type: 'easy',
            label: `Easy Run: ${easy.min}-${easy.max} min`,
            week,
            day: 'thursday'
        });
    } else if (dayOfWeek === longRunDayNum) { // Saturday or Sunday - Long
        const distance = getLongRunDistance(week);
        items.push({
            kind: 'run',
            type: 'long',
            label: distance === 'RACE' ? 'RACE DAY!' : `Long Run: ${distance} mi`,
            week,
            day: longRunDay,
            distance
        });
    } else if (dayOfWeek === easyDayAfterLong) { // Sunday or Monday - Easy
        const easy = getEasyRunSuggestion(week);
        items.push({
            kind: 'run',
            type: 'easy',
            label: `Easy Run: ${easy.min}-${easy.max} min`,
            week,
            day: dayOfWeek === 0 ? 'sunday' : 'monday'
        });
    }
    
    // Lifts (2 per week)
    if (dayOfWeek === 1) { // Monday - Lift A
        const lift = getLiftDescription(week, 'A');
        items.push({
            kind: 'lift',
            type: 'liftA',
            label: `Lift A: Squat ${lift.squat}, Bench ${lift.bench}, RDL ${lift.rdl}`,
            week,
            day: 'monday',
            lifts: lift
        });
    } else if (dayOfWeek === 3) { // Wednesday - Lift B
        const lift = getLiftDescription(week, 'B');
        items.push({
            kind: 'lift',
            type: 'liftB',
            label: `Lift B: Deadlift ${lift.deadlift}, Press ${lift.press}, Step-downs ${lift.stepDowns}, Soleus ${lift.soleus}`,
            week,
            day: 'wednesday',
            lifts: lift
        });
    }
    
    // Knee circuit (3x per week: Wed, Fri, Sun default)
    const kneeDays = longRunDay === 'sunday' ? [3, 5, 1] : [3, 5, 0]; // Wed, Fri, Mon if Sun long run, else Wed, Fri, Sun
    if (kneeDays.includes(dayOfWeek)) {
        items.push({
            kind: 'knee',
            label: 'Knee Circuit: Wall sits, step-downs, soleus raises, band walks',
            week,
            day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek]
        });
    }
    
    // Mobility (daily)
    items.push({
        kind: 'mobility',
        label: 'Mobility: Couch stretch, calf stretch, hamstring floss, ankle rocks, hips 90/90',
        week,
        day: 'daily'
    });
    
    return items;
}

// Get week view items
function getWeekItems(weekOffset, startDate, longRunDay = 'saturday') {
    if (!startDate) return [];
    
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the Monday of the week containing the start date
    const startDayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOfStartWeek = new Date(start);
    if (startDayOfWeek === 0) {
        // If start is Sunday, go back 6 days to Monday
        mondayOfStartWeek.setDate(start.getDate() - 6);
    } else {
        // Otherwise go back to Monday of that week
        mondayOfStartWeek.setDate(start.getDate() - (startDayOfWeek - 1));
    }
    mondayOfStartWeek.setHours(0, 0, 0, 0);
    
    // Calculate which week we're in (0 = week containing start date)
    const daysSinceMonday = Math.floor((today - mondayOfStartWeek) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(daysSinceMonday / 7);
    const targetWeek = currentWeek + weekOffset;
    
    // Calculate the Monday of the target week
    const weekStart = new Date(mondayOfStartWeek);
    weekStart.setDate(mondayOfStartWeek.getDate() + (targetWeek * 7));
    
    const weekItems = [];
    
    // Generate items for each day of the week (Mon-Sun)
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = getDateString(date);
        const items = getTodayItems(dateStr, startDate, longRunDay);
        
        weekItems.push({
            date: dateStr,
            dayOfWeek: i,
            items
        });
    }
    
    return weekItems;
}

// Get phase name for week
function getPhaseName(week) {
    if (week <= 8) return 'Base + Knee Calm';
    if (week <= 18) return 'Base Build';
    if (week <= 30) return 'Marathon Build';
    if (week <= 40) return 'Peak Specificity';
    return 'Taper';
}

