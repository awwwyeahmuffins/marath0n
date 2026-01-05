// Workout descriptions and examples

const WORKOUT_GUIDE = {
    runs: {
        easy: {
            title: "Easy Run",
            description: "Comfortable, conversational pace. You should be able to speak in full sentences.",
            example: "20-40 minutes at a pace where you can hold a conversation. Heart rate should be around 60-70% of max.",
            tips: [
                "Focus on easy breathing and relaxed form",
                "This is your recovery and aerobic base building",
                "Don't worry about pace - effort is what matters"
            ]
        },
        quality: {
            title: "Quality Run",
            description: "Structured workout with intervals, tempo, or hills depending on your training phase.",
            examples: {
                strides: {
                    title: "Strides (Weeks 1-8)",
                    description: "6x20 second pickups with full recovery",
                    howTo: "After your easy run, do 6x20 second accelerations. Start slow, build to about 90% effort, then decelerate. Walk or jog 60-90 seconds between each."
                },
                tempo: {
                    title: "Tempo Run",
                    description: "Sustained effort at comfortably hard pace",
                    howTo: "Warm up 10-15 min easy, then run 2x10 min at tempo pace (comfortably hard, can say a few words) with 2-3 min easy recovery. Cool down 10 min easy.",
                    pace: "About 15-20 seconds per mile slower than 5K pace, or around 85-90% max heart rate"
                },
                hills: {
                    title: "Hill Repeats",
                    description: "8x30-45 second hill efforts",
                    howTo: "Find a moderate hill (4-6% grade). Warm up 10-15 min. Run 8x30-45 seconds up the hill at controlled hard effort. Walk/jog back down for recovery. Cool down 10 min easy.",
                    tips: [
                        "Focus on good form: slight forward lean, drive knees, quick turnover",
                        "Effort should be controlled - not all-out sprint"
                    ]
                },
                intervals: {
                    title: "Intervals",
                    description: "5x3 minute intervals",
                    howTo: "Warm up 10-15 min easy. Run 5x3 minutes at 5K effort with 2-3 min easy jog recovery. Cool down 10 min easy.",
                    pace: "About 5K race pace or slightly faster"
                },
                mp: {
                    title: "Marathon Pace Repeats",
                    description: "3x2 miles at marathon pace",
                    howTo: "Warm up 10-15 min easy. Run 3x2 miles at your target marathon pace with 3-4 min easy jog recovery. Cool down 10-15 min easy.",
                    tips: [
                        "Practice your race day pace and fueling",
                        "This is race-specific training"
                    ]
                },
                "800m": {
                    title: "800m Repeats",
                    description: "6x800m at controlled hard effort",
                    howTo: "Warm up 10-15 min easy. Run 6x800m (2 laps on track) at controlled hard effort with 2-3 min easy jog recovery. Cool down 10-15 min easy.",
                    pace: "Slightly faster than 5K pace"
                }
            }
        },
        long: {
            title: "Long Run",
            description: "Your longest run of the week. Builds endurance and mental toughness.",
            howTo: "Start easy and stay easy. Pace should feel comfortable - you should finish feeling like you could run more.",
            tips: [
                "Practice your race day nutrition and hydration",
                "Start 30-60 seconds per mile slower than goal marathon pace",
                "Focus on time on feet, not pace",
                "These runs teach your body to burn fat efficiently"
            ],
            progression: "Distance increases throughout the plan, with cutback weeks for recovery."
        }
    },
    lifts: {
        squat: {
            title: "Squat",
            description: "Full body strength exercise targeting legs, glutes, and core.",
            howTo: [
                "Stand with feet shoulder-width apart, toes slightly turned out",
                "Lower down as if sitting in a chair, keeping chest up and knees tracking over toes",
                "Descend until thighs are parallel to floor (or as deep as comfortable)",
                "Drive through heels to stand back up",
                "Keep core engaged throughout"
            ],
            tips: [
                "Start with bodyweight or light weight to perfect form",
                "Focus on depth and control over weight",
                "3x5 means 3 sets of 5 reps"
            ],
            imageNote: "Search 'barbell back squat form' for video examples"
        },
        bench: {
            title: "Bench Press",
            description: "Upper body strength exercise for chest, shoulders, and triceps.",
            howTo: [
                "Lie on bench with eyes under the bar",
                "Grip bar slightly wider than shoulder-width",
                "Lower bar to chest with control (2-3 seconds)",
                "Press bar up explosively but controlled",
                "Keep feet flat on floor, core engaged"
            ],
            tips: [
                "Start light and focus on form",
                "Have a spotter when going heavy",
                "3x5 means 3 sets of 5 reps"
            ],
            imageNote: "Search 'bench press form' for video examples"
        },
        deadlift: {
            title: "Deadlift",
            description: "Posterior chain exercise - hamstrings, glutes, back, and core.",
            howTo: [
                "Stand with feet hip-width apart, bar over mid-foot",
                "Hinge at hips, keeping back straight, and grip bar",
                "Drive through heels, extend hips and knees simultaneously",
                "Stand tall with shoulders over bar",
                "Lower bar with control, reversing the movement"
            ],
            tips: [
                "This is a technical lift - start light",
                "Keep bar close to body throughout",
                "1x5 means 1 set of 5 reps (or 2x3 when heavy)"
            ],
            imageNote: "Search 'conventional deadlift form' for video examples"
        },
        press: {
            title: "Overhead Press",
            description: "Shoulder and tricep strength exercise.",
            howTo: [
                "Stand with feet shoulder-width apart",
                "Hold bar at shoulder height, hands just outside shoulders",
                "Press bar straight up, keeping core tight",
                "Lower with control back to shoulders"
            ],
            tips: [
                "Keep core engaged to protect lower back",
                "Don't arch excessively",
                "3x5 means 3 sets of 5 reps"
            ],
            imageNote: "Search 'overhead press form' for video examples"
        },
        rdl: {
            title: "Romanian Deadlift (RDL)",
            description: "Hamstring and glute focused deadlift variation.",
            howTo: [
                "Stand with feet hip-width apart, slight knee bend",
                "Hinge at hips, keeping back straight",
                "Lower weight down legs, feeling stretch in hamstrings",
                "Stop when you feel a good stretch (usually mid-shin)",
                "Drive hips forward to return to standing"
            ],
            tips: [
                "Keep knees slightly bent throughout",
                "Focus on feeling the stretch in hamstrings",
                "2x6-8 means 2 sets of 6-8 reps"
            ],
            imageNote: "Search 'RDL form' for video examples"
        }
    },
    knee: {
        wallSit: {
            title: "Wall Sit",
            description: "Isometric quadriceps and glute exercise for knee resilience.",
            howTo: [
                "Stand with back against wall",
                "Slide down until knees are at 90 degrees",
                "Hold position, keeping core engaged",
                "Start with 30 seconds, build to 45-60 seconds"
            ],
            tips: [
                "Keep knees directly over ankles",
                "Don't let knees cave inward",
                "5x30-45s means 5 sets of 30-45 seconds"
            ],
            imageNote: "Search 'wall sit exercise' for video examples"
        },
        stepDowns: {
            title: "Step-Downs",
            description: "Eccentric quadriceps exercise to build knee control.",
            howTo: [
                "Stand on a step or box (4-6 inches high)",
                "Slowly lower opposite foot to ground, taking 3-5 seconds",
                "Touch ground lightly, then push back up",
                "Focus on controlling the lowering phase",
                "Repeat on same leg for all reps, then switch"
            ],
            tips: [
                "The slow lowering is the key - this is eccentric training",
                "Keep knee tracking over toes",
                "2x6 each leg means 2 sets of 6 reps per leg"
            ],
            imageNote: "Search 'step down exercise knee' for video examples"
        },
        soleus: {
            title: "Soleus Raises",
            description: "Calf exercise targeting the soleus muscle (deep calf).",
            howTo: [
                "Stand with feet hip-width apart",
                "Bend knees slightly (about 30 degrees)",
                "Rise up onto toes",
                "Lower with control",
                "Keep knees bent throughout"
            ],
            tips: [
                "The bent knee position targets soleus specifically",
                "This muscle is important for running economy",
                "2x15-20 means 2 sets of 15-20 reps"
            ],
            imageNote: "Search 'soleus raise exercise' for video examples"
        },
        bandWalks: {
            title: "Band Walks",
            description: "Glute activation exercise for hip stability.",
            howTo: [
                "Place resistance band around legs (just above or below knees)",
                "Stand with feet shoulder-width apart, slight squat",
                "Take 10-15 steps to the side, keeping tension on band",
                "Return the other direction",
                "Keep knees tracking over toes"
            ],
            tips: [
                "Focus on feeling glutes working",
                "Keep core engaged",
                "2x10-15 steps means 2 sets of 10-15 steps each direction"
            ],
            imageNote: "Search 'lateral band walk exercise' for video examples"
        }
    },
    mobility: {
        couchStretch: {
            title: "Couch Stretch",
            description: "Hip flexor and quadriceps stretch.",
            howTo: [
                "Kneel on floor with one foot on couch/chair behind you",
                "Slide front foot forward until you feel stretch in front of hip",
                "Hold 60-90 seconds each side",
                "Keep core engaged, don't arch back excessively"
            ],
            imageNote: "Search 'couch stretch hip flexor' for video examples"
        },
        calfStretch: {
            title: "Calf Stretch",
            description: "Stretches gastrocnemius and soleus muscles.",
            howTo: [
                "Stand facing wall, one foot forward",
                "Keep back leg straight, heel on ground",
                "Lean into wall until you feel stretch in calf",
                "Hold 60 seconds, then bend back knee to stretch soleus",
                "Repeat on other side"
            ],
            imageNote: "Search 'calf stretch running' for video examples"
        },
        hamstringFloss: {
            title: "Hamstring Flossing",
            description: "Dynamic hamstring mobility exercise.",
            howTo: [
                "Sit on ground with one leg straight, other bent",
                "Loop band or towel around straight leg foot",
                "Gently pull leg toward you, then release",
                "Repeat 10-15 times, then switch legs"
            ],
            imageNote: "Search 'hamstring flossing exercise' for video examples"
        },
        ankleRocks: {
            title: "Ankle Rocks",
            description: "Ankle mobility and calf stretch.",
            howTo: [
                "Stand facing wall, place hands on wall",
                "Step one foot back, keep heel on ground",
                "Rock forward onto front foot, feeling stretch in back calf",
                "Rock back, repeat 10-15 times",
                "Switch legs"
            ],
            imageNote: "Search 'ankle rock mobility' for video examples"
        },
        hips9090: {
            title: "Hips 90/90",
            description: "Hip mobility and rotation exercise.",
            howTo: [
                "Sit on ground with one leg bent 90 degrees in front, other bent 90 degrees to side",
                "Keep both knees at 90 degrees",
                "Gently lean forward, feeling stretch in hip",
                "Hold 60-90 seconds, then switch leg positions"
            ],
            imageNote: "Search '90 90 hip stretch' for video examples"
        }
    }
};

// Get workout guide for a specific activity
function getWorkoutGuide(kind, type = null) {
    if (kind === 'run') {
        if (type === 'easy') return WORKOUT_GUIDE.runs.easy;
        if (type === 'long') return WORKOUT_GUIDE.runs.long;
        if (type === 'quality') {
            // Return quality run guide - will need week number to determine specific workout
            return WORKOUT_GUIDE.runs.quality;
        }
        return WORKOUT_GUIDE.runs.easy;
    } else if (kind === 'lift') {
        return WORKOUT_GUIDE.lifts;
    } else if (kind === 'knee') {
        return WORKOUT_GUIDE.knee;
    } else if (kind === 'mobility') {
        return WORKOUT_GUIDE.mobility;
    }
    return null;
}

