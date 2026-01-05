// Statistics and aggregations

// Calculate 1RM using Epley formula: 1RM = weight * (1 + reps/30)
function calculate1RM(weight, reps) {
    if (!weight || !reps || reps === 0) return null;
    return Math.round(weight * (1 + reps / 30));
}

// Get weekly run totals
async function getWeeklyTotals(startDate, endDate) {
    if (!startDate) return [];
    
    const activities = await getActivities({
        dateRange: {
            start: startDate,
            end: endDate || getDateString(new Date())
        }
    });
    
    const runs = activities.filter(a => a.kind === 'run');
    
    // Group by week
    const weeklyData = {};
    
    runs.forEach(run => {
        const runDate = new Date(run.date);
        const start = new Date(startDate);
        const daysDiff = Math.floor((runDate - start) / (1000 * 60 * 60 * 24));
        const week = Math.floor(daysDiff / 7) + 1;
        
        if (!weeklyData[week]) {
            weeklyData[week] = {
                week,
                distance: 0,
                duration: 0,
                count: 0
            };
        }
        
        const payload = run.payload || {};
        if (payload.distance) {
            weeklyData[week].distance += payload.distance;
        }
        if (payload.durationMin) {
            weeklyData[week].duration += payload.durationMin;
        }
        weeklyData[week].count++;
    });
    
    return Object.values(weeklyData)
        .sort((a, b) => b.week - a.week)
        .slice(0, 12); // Last 12 weeks
}

// Get long run trend (last N long runs)
async function getLongRunTrend(count = 8) {
    const activities = await getActivities({ kind: 'run' });
    
    const longRuns = activities
        .filter(a => {
            const payload = a.payload || {};
            return payload.runType === 'long' && payload.distance;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, count);
    
    return longRuns.map(run => ({
        date: run.date,
        distance: run.payload.distance,
        duration: run.payload.durationMin || null
    }));
}

// Get knee pain trend (last N days with entries)
async function getKneePainTrend(days = 14) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activities = await getActivities({
        dateRange: {
            start: getDateString(startDate),
            end: getDateString(endDate)
        }
    });
    
    const withPain = activities
        .filter(a => a.kneePain !== null && a.kneePain !== undefined)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return withPain.map(a => ({
        date: a.date,
        pain: a.kneePain,
        kind: a.kind,
        notes: a.notes || ''
    }));
}

// Get lift progress (best recent sets for bench/squat/deadlift)
async function getLiftProgress() {
    const activities = await getActivities({ kind: 'lift' });
    
    const lifts = {
        bench: [],
        squat: [],
        deadlift: []
    };
    
    activities.forEach(activity => {
        const payload = activity.payload || {};
        const liftList = payload.lifts || [];
        
        liftList.forEach(lift => {
            if (lifts[lift.name]) {
                lifts[lift.name].push({
                    date: activity.date,
                    weight: lift.weight,
                    sets: lift.sets,
                    reps: lift.reps,
                    rpe: activity.rpe,
                    kneePain: activity.kneePain
                });
            }
        });
    });
    
    // Get best recent set for each lift (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = getDateString(thirtyDaysAgo);
    
    const progress = {};
    
    Object.keys(lifts).forEach(liftName => {
        const recent = lifts[liftName]
            .filter(l => l.date >= cutoff)
            .sort((a, b) => {
                // Sort by estimated 1RM descending
                const a1RM = calculate1RM(a.weight, a.reps) || 0;
                const b1RM = calculate1RM(b.weight, b.reps) || 0;
                return b1RM - a1RM;
            });
        
        if (recent.length > 0) {
            const best = recent[0];
            progress[liftName] = {
                ...best,
                estimated1RM: calculate1RM(best.weight, best.reps)
            };
        }
    });
    
    return progress;
}

// Get goal progress percentage
function getGoalProgress(current, target) {
    if (!current || current === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
}

// Get current values for goals
const GOALS = {
    bench: 225,
    squat: 225,
    deadlift: 305
};

const CURRENT = {
    bench: 155,
    squat: 105,
    deadlift: 180
};

async function getGoalProgressData() {
    const progress = await getLiftProgress();
    
    return {
        bench: {
            current: progress.bench?.estimated1RM || CURRENT.bench,
            target: GOALS.bench,
            progress: getGoalProgress(progress.bench?.estimated1RM || CURRENT.bench, GOALS.bench),
            bestSet: progress.bench
        },
        squat: {
            current: progress.squat?.estimated1RM || CURRENT.squat,
            target: GOALS.squat,
            progress: getGoalProgress(progress.squat?.estimated1RM || CURRENT.squat, GOALS.squat),
            bestSet: progress.squat
        },
        deadlift: {
            current: progress.deadlift?.estimated1RM || CURRENT.deadlift,
            target: GOALS.deadlift,
            progress: getGoalProgress(progress.deadlift?.estimated1RM || CURRENT.deadlift, GOALS.deadlift),
            bestSet: progress.deadlift
        }
    };
}

