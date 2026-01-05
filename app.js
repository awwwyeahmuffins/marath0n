// Hash router and view rendering

let currentRoute = 'today';
let currentWeekOffset = 0;
let logPrefill = null;

// Initialize app
async function init() {
    try {
        console.log('Initializing app...');
        try {
            await initDB();
            console.log('Database initialized');
        } catch (dbError) {
            console.error('Database init failed:', dbError);
            // Continue anyway - app can work with limited functionality
        }
        
        // Set up hashchange listener first
        window.addEventListener('hashchange', () => {
            console.log('Hash changed to:', window.location.hash);
            renderRoute();
        });
        
        // Set initial hash if needed (this will trigger hashchange if hash changes)
        const currentHash = window.location.hash;
        if (!currentHash || currentHash === '#' || currentHash === '') {
            console.log('Setting initial hash to #/today');
            window.location.hash = '#/today';
        } else {
            console.log('Using existing hash:', currentHash);
        }
        
        setupNavigation();
        
        // Render current route (whether hash was set or already existed)
        console.log('Rendering initial route...');
        await renderRoute();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Init error:', error);
        throw error;
    }
}

// Setup hash router (called during init, listener added there)
function setupRouter() {
    // Router setup is now handled in init() to ensure proper order
}

// Get current route from hash
function getRoute() {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('/')) {
        return hash.slice(1) || 'today';
    }
    return 'today';
}

// Render current route
async function renderRoute() {
    try {
        const route = getRoute();
        currentRoute = route;
        updateNavigation();
        
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found!');
            return;
        }
        
        app.innerHTML = '';
        app.className = 'view';
        
        switch (route) {
            case 'today':
                await renderToday();
                break;
            case 'log':
                renderLog(logPrefill);
                logPrefill = null;
                break;
            case 'plan':
                await renderPlan(currentWeekOffset);
                break;
            case 'stats':
                await renderStats();
                break;
            case 'settings':
                await renderSettings();
                break;
            default:
                window.location.hash = '#/today';
        }
    } catch (error) {
        console.error('Render route error:', error);
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '<div class="view"><h1>Error</h1><p>Failed to render view.</p><p style="color: red; font-size: 14px;">' + error.message + '</p></div>';
        }
    }
}

// Update navigation active state
function updateNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.route === currentRoute) {
            item.classList.add('active');
        }
    });
}

// Setup navigation click handlers
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length === 0) {
        console.error('No navigation items found!');
        return;
    }
    
    navItems.forEach(item => {
        // Use onclick instead of addEventListener to avoid issues
        item.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const route = item.dataset.route;
            if (!route) {
                console.error('No route found for nav item');
                return;
            }
            if (route === 'plan') {
                currentWeekOffset = 0;
            }
            const newHash = `#/${route}`;
            console.log('Navigating to:', newHash);
            if (window.location.hash !== newHash) {
                window.location.hash = newHash;
            } else {
                // Hash is already set, manually trigger render
                console.log('Hash already set, manually rendering');
                renderRoute();
            }
        };
    });
    console.log('Navigation setup complete,', navItems.length, 'items');
}

// Render Today view
async function renderToday() {
    const app = document.getElementById('app');
    
    const startDate = await getMeta('startDate');
    const longRunDay = await getMeta('longRunDay') || 'saturday';
    const units = await getMeta('units') || 'mi';
    
    if (!startDate) {
        const container = createElement('div', { className: 'view' });
        container.appendChild(createElement('h1', { textContent: 'Today' }));
        const card = createElement('div', { className: 'card' });
        card.appendChild(createElement('p', { textContent: 'Please set your plan start date in Settings to begin tracking.' }));
        const settingsBtn = createElement('button', {
            className: 'btn btn-primary',
            style: 'display: inline-block; margin-top: 16px;',
            textContent: 'Go to Settings',
            onclick: () => {
                window.location.hash = '#/settings';
            }
        });
        card.appendChild(settingsBtn);
        container.appendChild(card);
        app.appendChild(container);
        return;
    }
    
    const today = getDateString(new Date());
    const todayItems = getTodayItems(today, startDate, longRunDay);
    const week = getWeekNumber(today, startDate);
    
    // Get logged activities for today
    const loggedActivities = await getActivities({ date: today });
    
    // Check for knee pain banner
    const recentPain = await getKneePainTrend(7);
    const hasHighPain = recentPain.some(p => p.pain > 3);
    
    const container = createElement('div', { className: 'view' });
    
    // Header
    container.appendChild(createElement('h1', { textContent: 'Today' }));
    
    // Week info
    const weekInfo = createElement('div', { className: 'card' }, [
        createElement('div', { className: 'card-header' }, [
            createElement('div', { className: 'card-title', textContent: `Week ${week} - ${getPhaseName(week)}` }),
            createElement('div', { textContent: formatDate(today), style: 'font-size: 15px; color: var(--text-secondary);' })
        ])
    ]);
    container.appendChild(weekInfo);
    
    // Knee pain banner
    if (hasHighPain) {
        const banner = createElement('div', { className: 'banner' }, [
            createElement('strong', { textContent: 'Knee Pain Alert' }),
            createElement('div', { textContent: 'Consider a 7-day deload: reduce run volume 20-30% and swap quality run for easy.' }),
            createElement('button', {
                className: 'btn btn-secondary',
                style: 'margin-top: 12px; background: rgba(255,255,255,0.2); color: white; border-color: rgba(255,255,255,0.3);',
                textContent: 'Do Isometrics (Wall sits 5x30-45s)',
                onclick: () => {
                    logPrefill = { kind: 'knee', wallSitSets: 5, wallSitSec: 30 };
                    window.location.hash = '#/log';
                }
            })
        ]);
        container.appendChild(banner);
    }
    
    // Today's items
    const itemsCard = createElement('div', { className: 'card' });
    itemsCard.appendChild(createElement('h3', { textContent: "Today's Prescription" }));
    
    if (todayItems.length === 0) {
        itemsCard.appendChild(createElement('p', { textContent: 'Rest day - no activities scheduled.', style: 'color: var(--text-secondary);' }));
    } else {
        const itemsList = createElement('ul', { className: 'activity-list' });
        
        todayItems.forEach(item => {
            if (!item || !item.kind) return; // Skip null items
            
            // Check if completed
            const isCompleted = loggedActivities.some(logged => {
                if (!logged || logged.kind !== item.kind) return false;
                if (item.kind === 'run' && logged.payload?.runType === item.type) return true;
                if (item.kind === 'lift') return true; // Any lift counts
                if (item.kind === 'knee') return true; // Any knee work counts
                if (item.kind === 'mobility') return true; // Any mobility counts
                return false;
            });
            
            // Create expandable item with instructions
            const listItem = createElement('li', {
                className: `activity-item ${isCompleted ? 'completed' : ''}`,
                style: 'flex-direction: column; align-items: flex-start;'
            });
            
            // Header row
            const headerRow = createElement('div', {
                style: 'display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;'
            });
            
            const labelSpan = createElement('span', { 
                textContent: item.label,
                style: 'font-weight: 500;'
            });
            headerRow.appendChild(labelSpan);
            
            const rightSide = createElement('div', { style: 'display: flex; align-items: center; gap: 8px;' });
            if (isCompleted) {
                rightSide.appendChild(createElement('span', { textContent: '✓', style: 'color: var(--success-color); font-size: 20px;' }));
            }
            const expandBtn = createElement('button', {
                textContent: '📖',
                style: 'background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px;',
                onclick: (e) => {
                    e.stopPropagation();
                    const details = listItem.querySelector('.activity-details');
                    if (details) {
                        details.style.display = details.style.display === 'none' ? 'block' : 'none';
                    }
                }
            });
            rightSide.appendChild(expandBtn);
            headerRow.appendChild(rightSide);
            listItem.appendChild(headerRow);
            
            // Details section (collapsed by default)
            const details = createElement('div', {
                className: 'activity-details',
                style: 'display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); width: 100%;'
            });
            
            // Get workout guide info
            let guideInfo = null;
            if (item.kind === 'run') {
                if (item.type === 'easy') {
                    guideInfo = WORKOUT_GUIDE.runs.easy;
                } else if (item.type === 'long') {
                    guideInfo = WORKOUT_GUIDE.runs.long;
                } else if (item.type === 'quality') {
                    // Get quality run type based on week
                    let qualityType = 'tempo'; // default
                    if (week <= 8) {
                        qualityType = 'strides';
                    } else if (week <= 18) {
                        qualityType = week % 2 === 0 ? 'tempo' : 'hills';
                    } else if (week <= 30) {
                        qualityType = week % 2 === 0 ? 'tempo' : 'intervals';
                    } else if (week <= 40) {
                        qualityType = week % 2 === 0 ? 'mp' : '800m';
                    }
                    guideInfo = WORKOUT_GUIDE.runs.quality.examples[qualityType] || WORKOUT_GUIDE.runs.quality.examples.tempo;
                }
            } else if (item.kind === 'lift') {
                guideInfo = WORKOUT_GUIDE.lifts;
            } else if (item.kind === 'knee') {
                guideInfo = WORKOUT_GUIDE.knee;
            } else if (item.kind === 'mobility') {
                guideInfo = WORKOUT_GUIDE.mobility;
            }
            
            if (guideInfo) {
                // Add description
                if (guideInfo.description) {
                    details.appendChild(createElement('p', {
                        textContent: guideInfo.description,
                        style: 'margin: 8px 0; font-weight: 500;'
                    }));
                }
                
                // Add exercise GIF/image if available (for non-run exercises)
                if (item.kind !== 'run') {
                    const imageContainer = createElement('div', {
                        style: 'margin: 12px 0; text-align: center;'
                    });
                    
                    if (item.kind === 'knee') {
                        // Show knee exercise GIFs
                        const kneeGifs = ['wall-sit', 'step-downs', 'soleus', 'band-walks'];
                        kneeGifs.forEach(gifName => {
                            const img = createElement('img', {
                                src: `/pwa/exercises/${gifName}.gif`,
                                alt: gifName,
                                style: 'max-width: 100%; height: auto; margin: 8px; border-radius: 8px;',
                                onerror: function() {
                                    this.style.display = 'none';
                                }
                            });
                            imageContainer.appendChild(img);
                        });
                    } else if (item.kind === 'mobility') {
                        // Show mobility exercise GIFs
                        const mobilityGifs = ['couch-stretch', 'calf-stretch', 'hamstring-floss', 'ankle-rocks', 'hips-9090'];
                        mobilityGifs.forEach(gifName => {
                            const img = createElement('img', {
                                src: `/pwa/exercises/${gifName}.gif`,
                                alt: gifName,
                                style: 'max-width: 100%; height: auto; margin: 8px; border-radius: 8px;',
                                onerror: function() {
                                    this.style.display = 'none';
                                }
                            });
                            imageContainer.appendChild(img);
                        });
                    }
                    
                    if (imageContainer.children.length > 0) {
                        details.appendChild(imageContainer);
                    }
                }
                
                // Add how-to for runs
                if (item.kind === 'run' && guideInfo.howTo) {
                    details.appendChild(createElement('p', {
                        textContent: guideInfo.howTo,
                        style: 'margin: 8px 0;'
                    }));
                }
                
                // Add example for easy runs
                if (item.kind === 'run' && item.type === 'easy' && guideInfo.example) {
                    details.appendChild(createElement('p', {
                        textContent: 'Example: ' + guideInfo.example,
                        style: 'margin: 8px 0; padding: 8px; background: var(--bg-color); border-radius: 6px;'
                    }));
                }
                
                // Add tips
                if (guideInfo.tips && Array.isArray(guideInfo.tips)) {
                    const tipsList = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px;' });
                    guideInfo.tips.forEach(tip => {
                        tipsList.appendChild(createElement('li', {
                            textContent: tip,
                            style: 'margin: 4px 0; font-size: 14px;'
                        }));
                    });
                    details.appendChild(tipsList);
                }
                
                // Add how-to steps for lifts/knee/mobility
                if (guideInfo.howTo && Array.isArray(guideInfo.howTo)) {
                    const howToList = createElement('ol', { style: 'margin: 8px 0; padding-left: 20px;' });
                    guideInfo.howTo.forEach(step => {
                        howToList.appendChild(createElement('li', {
                            textContent: step,
                            style: 'margin: 4px 0; font-size: 14px;'
                        }));
                    });
                    details.appendChild(howToList);
                }
                
                // Add image note
                if (guideInfo.imageNote) {
                    details.appendChild(createElement('p', {
                        textContent: '💡 ' + guideInfo.imageNote,
                        style: 'margin: 8px 0; font-size: 13px; color: var(--text-secondary); font-style: italic;'
                    }));
                }
                
                // For lifts, show all exercises
                if (item.kind === 'lift' && typeof guideInfo === 'object' && !guideInfo.description) {
                    Object.entries(guideInfo).forEach(([key, lift]) => {
                        if (lift.title) {
                            const liftDiv = createElement('div', {
                                style: 'margin: 12px 0; padding: 10px; background: var(--bg-color); border-radius: 6px;'
                            });
                            liftDiv.appendChild(createElement('h4', {
                                textContent: lift.title,
                                style: 'margin: 0 0 6px 0; font-size: 16px;'
                            }));
                            
                            // Add exercise GIF
                            const gifName = key === 'rdl' ? 'rdl' : key;
                            const img = createElement('img', {
                                src: `/pwa/exercises/${gifName}.gif`,
                                alt: lift.title,
                                style: 'max-width: 100%; height: auto; margin: 8px 0; border-radius: 8px; display: block;',
                                onerror: function() {
                                    this.style.display = 'none';
                                }
                            });
                            liftDiv.appendChild(img);
                            
                            if (lift.description) {
                                liftDiv.appendChild(createElement('p', {
                                    textContent: lift.description,
                                    style: 'margin: 4px 0; font-size: 14px;'
                                }));
                            }
                            if (lift.howTo && Array.isArray(lift.howTo)) {
                                const steps = createElement('ol', { style: 'margin: 4px 0; padding-left: 20px; font-size: 13px;' });
                                lift.howTo.slice(0, 3).forEach(step => {
                                    steps.appendChild(createElement('li', { textContent: step }));
                                });
                                liftDiv.appendChild(steps);
                            }
                            if (lift.imageNote) {
                                liftDiv.appendChild(createElement('p', {
                                    textContent: '💡 ' + lift.imageNote,
                                    style: 'margin: 4px 0; font-size: 12px; color: var(--text-secondary); font-style: italic;'
                                }));
                            }
                            details.appendChild(liftDiv);
                        }
                    });
                }
            }
            
            listItem.appendChild(details);
            
            // Click to log
            headerRow.onclick = () => {
                // Prefill log based on item type
                if (item.kind === 'run') {
                    logPrefill = {
                        kind: 'run',
                        runType: item.type,
                        date: today,
                        distance: item.distance || null
                    };
                } else if (item.kind === 'lift') {
                    logPrefill = {
                        kind: 'lift',
                        date: today,
                        lifts: item.lifts ? Object.entries(item.lifts).map(([name, desc]) => ({
                            name,
                            desc
                        })) : []
                    };
                } else if (item.kind === 'knee') {
                    logPrefill = { kind: 'knee', date: today };
                } else if (item.kind === 'mobility') {
                    logPrefill = { kind: 'mobility', date: today };
                }
                window.location.hash = '#/log';
            };
            
            itemsList.appendChild(listItem);
        });
        
        itemsCard.appendChild(itemsList);
    }
    
    container.appendChild(itemsCard);
    
    // Quick log strip
    const quickLogCard = createElement('div', { className: 'card' });
    quickLogCard.appendChild(createElement('h3', { textContent: 'Quick Log' }));
    const quickLog = createElement('div', { className: 'quick-log' });
    
    const quickLogButtons = [
        { label: '+ Easy Run', type: 'run', runType: 'easy' },
        { label: '+ Quality Run', type: 'run', runType: 'quality' },
        { label: '+ Long Run', type: 'run', runType: 'long' },
        { label: '+ Lift', type: 'lift' },
        { label: '+ Knee Circuit', type: 'knee' },
        { label: '+ Mobility', type: 'mobility' }
    ];
    
    quickLogButtons.forEach(btn => {
        const button = createElement('button', {
            className: 'quick-log-btn',
            textContent: btn.label,
            onclick: () => {
                logPrefill = {
                    kind: btn.type,
                    date: today,
                    ...(btn.runType && { runType: btn.runType })
                };
                window.location.hash = '#/log';
            }
        });
        if (btn.type === 'mobility' || btn.type === 'knee') {
            button.classList.add('secondary');
        }
        quickLog.appendChild(button);
    });
    
    quickLogCard.appendChild(quickLog);
    container.appendChild(quickLogCard);
    
    app.appendChild(container);
}

// Render Log view
function renderLog(prefill = {}) {
    const app = document.getElementById('app');
    const container = createElement('div', { className: 'view' });
    
    container.appendChild(createElement('h1', { textContent: 'Log Activity' }));
    
    // Activity type selector
    const typeSelector = createElement('div', { className: 'activity-type-selector' });
    const types = [
        { key: 'run', label: 'Run' },
        { key: 'lift', label: 'Lift' },
        { key: 'knee', label: 'Knee' },
        { key: 'mobility', label: 'Mobility' }
    ];
    
    const selectedType = prefill.kind || 'run';
    let currentForm = null;
    let formContainer = null;
    
    types.forEach(type => {
        const btn = createElement('button', {
            type: 'button',
            className: `activity-type-btn ${selectedType === type.key ? 'active' : ''}`,
            textContent: type.label,
            onclick: () => {
                // Update active button
                typeSelector.querySelectorAll('.activity-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Render form
                if (formContainer) {
                    formContainer.innerHTML = '';
                    const newPrefill = { ...prefill, kind: type.key };
                    if (type.key === 'run') {
                        currentForm = createRunForm(newPrefill);
                    } else if (type.key === 'lift') {
                        currentForm = createLiftForm(newPrefill);
                    } else if (type.key === 'knee') {
                        currentForm = createKneeForm(newPrefill);
                    } else if (type.key === 'mobility') {
                        currentForm = createMobilityForm(newPrefill);
                    }
                    formContainer.appendChild(currentForm);
                }
            }
        });
        typeSelector.appendChild(btn);
    });
    
    container.appendChild(typeSelector);
    
    // Form container
    formContainer = createElement('div', { id: 'formContainer' });
    
    // Initial form
    if (selectedType === 'run') {
        currentForm = createRunForm(prefill);
    } else if (selectedType === 'lift') {
        currentForm = createLiftForm(prefill);
    } else if (selectedType === 'knee') {
        currentForm = createKneeForm(prefill);
    } else if (selectedType === 'mobility') {
        currentForm = createMobilityForm(prefill);
    }
    
    formContainer.appendChild(currentForm);
    container.appendChild(formContainer);
    
    // Form submit handler
    const handleSubmit = async (e, addAnother = false) => {
        e.preventDefault();
        const formData = new FormData(currentForm);
        const activity = {
            date: formData.get('date'),
            kind: selectedType,
            payload: {},
            kneePain: formData.get('kneePain') ? parseInt(formData.get('kneePain')) : null,
            rpe: formData.get('rpe') ? parseInt(formData.get('rpe')) : null,
            notes: formData.get('notes') || null
        };
        
        if (selectedType === 'run') {
            activity.payload = {
                runType: formData.get('runType'),
                distance: formData.get('distance') ? parseFloat(formData.get('distance')) : null,
                durationMin: formData.get('durationMin') ? parseInt(formData.get('durationMin')) : null,
                surface: null
            };
        } else if (selectedType === 'lift') {
            const lifts = [];
            const liftEntries = formContainer.querySelectorAll('.lift-entry');
            liftEntries.forEach(entry => {
                const name = entry.querySelector('[name="liftName"]').value;
                const weight = parseFloat(entry.querySelector('[name="weight"]').value);
                const sets = parseInt(entry.querySelector('[name="sets"]').value);
                const reps = parseInt(entry.querySelector('[name="reps"]').value);
                if (name && weight && sets && reps) {
                    lifts.push({ name, weight, sets, reps });
                }
            });
            activity.payload = { lifts };
        } else if (selectedType === 'knee') {
            activity.payload = {
                wallSitSets: formData.get('wallSitSets') ? parseInt(formData.get('wallSitSets')) : null,
                wallSitSec: formData.get('wallSitSec') ? parseInt(formData.get('wallSitSec')) : null,
                stepDownSets: formData.get('stepDownSets') ? parseInt(formData.get('stepDownSets')) : null,
                stepDownRepsEach: formData.get('stepDownRepsEach') ? parseInt(formData.get('stepDownRepsEach')) : null,
                soleusSets: formData.get('soleusSets') ? parseInt(formData.get('soleusSets')) : null,
                soleusReps: formData.get('soleusReps') ? parseInt(formData.get('soleusReps')) : null,
                bandWalkSets: formData.get('bandWalkSets') ? parseInt(formData.get('bandWalkSets')) : null,
                bandWalkSteps: formData.get('bandWalkSteps') ? parseInt(formData.get('bandWalkSteps')) : null
            };
        } else if (selectedType === 'mobility') {
            activity.payload = {
                couchStretch: formData.get('couchStretch') === 'on',
                calfStretch: formData.get('calfStretch') === 'on',
                hamstringFloss: formData.get('hamstringFloss') === 'on',
                ankleRocks: formData.get('ankleRocks') === 'on',
                hips9090: formData.get('hips9090') === 'on',
                minutes: formData.get('minutes') ? parseInt(formData.get('minutes')) : null
            };
        }
        
        try {
            await saveActivity(activity);
            if (addAnother) {
                // Reset form but keep type
                formContainer.innerHTML = '';
                if (selectedType === 'run') {
                    currentForm = createRunForm({ kind: selectedType, date: activity.date });
                } else if (selectedType === 'lift') {
                    currentForm = createLiftForm({ kind: selectedType, date: activity.date });
                } else if (selectedType === 'knee') {
                    currentForm = createKneeForm({ kind: selectedType, date: activity.date });
                } else if (selectedType === 'mobility') {
                    currentForm = createMobilityForm({ kind: selectedType, date: activity.date });
                }
                formContainer.appendChild(currentForm);
            } else {
                window.location.hash = '#/today';
            }
        } catch (error) {
            alert('Error saving activity: ' + error.message);
        }
    };
    
    // Buttons
    const buttonGroup = createElement('div', { className: 'btn-group' });
    buttonGroup.appendChild(createElement('button', {
        type: 'button',
        className: 'btn btn-secondary',
        textContent: 'Save & Add Another',
        onclick: (e) => handleSubmit(e, true)
    }));
    buttonGroup.appendChild(createElement('button', {
        type: 'button',
        className: 'btn btn-primary',
        textContent: 'Save',
        onclick: (e) => handleSubmit(e, false)
    }));
    
    // Add submit handler to form
    currentForm.addEventListener('submit', (e) => handleSubmit(e, false));
    container.appendChild(buttonGroup);
    
    app.appendChild(container);
}

// Render Plan view
async function renderPlan(weekOffset = 0) {
    const app = document.getElementById('app');
    const startDate = await getMeta('startDate');
    const longRunDay = await getMeta('longRunDay') || 'saturday';
    
    if (!startDate) {
        const container = createElement('div', { className: 'view' });
        container.appendChild(createElement('h1', { textContent: 'Plan' }));
        const card = createElement('div', { className: 'card' });
        card.appendChild(createElement('p', { textContent: 'Please set your plan start date in Settings.' }));
        const settingsBtn = createElement('button', {
            className: 'btn btn-primary',
            style: 'display: inline-block; margin-top: 16px;',
            textContent: 'Go to Settings',
            onclick: () => {
                window.location.hash = '#/settings';
            }
        });
        card.appendChild(settingsBtn);
        container.appendChild(card);
        app.appendChild(container);
        return;
    }
    
    const weekItems = getWeekItems(weekOffset, startDate, longRunDay);
    const today = getDateString(new Date());
    
    // Get logged activities for the week
    const weekStart = weekItems[0].date;
    const weekEnd = weekItems[6].date;
    const loggedActivities = await getActivities({
        dateRange: { start: weekStart, end: weekEnd }
    });
    
    const container = createElement('div', { className: 'view' });
    
    // Header with guide button
    const headerRow = createElement('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;' });
    headerRow.appendChild(createElement('h1', { textContent: 'Plan', style: 'margin: 0;' }));
    const guideBtn = createElement('button', {
        className: 'btn btn-secondary',
        textContent: '📖 Workout Guide',
        style: 'font-size: 14px; padding: 10px 16px;',
        onclick: () => {
            renderWorkoutGuide();
        }
    });
    headerRow.appendChild(guideBtn);
    container.appendChild(headerRow);
    
    // Week navigation
    const weekHeader = createElement('div', { className: 'week-header' });
    const weekNav = createElement('div', { className: 'week-nav' });
    
    const prevBtn = createElement('button', {
        className: 'btn btn-secondary',
        textContent: '← Prev',
        onclick: () => {
            currentWeekOffset--;
            renderPlan(currentWeekOffset);
        }
    });
    
    const nextBtn = createElement('button', {
        className: 'btn btn-secondary',
        textContent: 'Next →',
        onclick: () => {
            currentWeekOffset++;
            renderPlan(currentWeekOffset);
        }
    });
    
    // Calculate week number
    const start = new Date(startDate);
    const current = new Date(weekItems[0].date);
    const daysDiff = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(daysDiff / 7) + 1;
    
    weekNav.appendChild(prevBtn);
    weekNav.appendChild(createElement('span', {
        textContent: `Week ${weekNum}`,
        style: 'font-weight: 600; font-size: 17px; padding: 0 16px;'
    }));
    weekNav.appendChild(nextBtn);
    
    weekHeader.appendChild(weekNav);
    container.appendChild(weekHeader);
    
    // Week grid
    const weekGrid = createElement('div', { className: 'week-grid' });
    
    // Day headers
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
        weekGrid.appendChild(createElement('div', { className: 'day-header', textContent: day }));
    });
    
    // Day cells
    weekItems.forEach(dayData => {
        const dayCell = createElement('div', {
            className: `day-cell ${dayData.date === today ? 'today' : ''}`
        });
        
        const date = new Date(dayData.date + 'T00:00:00');
        dayCell.appendChild(createElement('div', {
            className: 'day-number',
            textContent: date.getDate()
        }));
        
        if (dayData.items && Array.isArray(dayData.items)) {
            dayData.items.forEach(item => {
                if (!item || !item.kind) return; // Skip null/undefined items
                
                // Check if completed
                const isCompleted = loggedActivities.some(logged => {
                    if (!logged || logged.date !== dayData.date) return false;
                    if (logged.kind !== item.kind) return false;
                    if (item.kind === 'run' && logged.payload?.runType === item.type) return true;
                    if (item.kind === 'lift') return true;
                    if (item.kind === 'knee') return true;
                    if (item.kind === 'mobility') return true;
                    return false;
                });
                
                // Create activity with better formatting
                const activityEl = createElement('div', {
                    className: `activity ${isCompleted ? 'completed' : ''}`
                });
                
                // Add icon/emoji based on activity type
                let icon = '';
                if (item.kind === 'run') {
                    if (item.type === 'long') icon = '🏃‍♂️ ';
                    else if (item.type === 'quality') icon = '⚡ ';
                    else icon = '👟 ';
                } else if (item.kind === 'lift') icon = '💪 ';
                else if (item.kind === 'knee') icon = '🦵 ';
                else if (item.kind === 'mobility') icon = '🧘 ';
                
                const labelText = (item.label || '').length > 25 ? item.label.substring(0, 25) + '...' : (item.label || '');
                activityEl.textContent = icon + labelText;
                activityEl.title = item.label || ''; // Full text on hover
                
                activityEl.onclick = () => {
                    logPrefill = {
                        kind: item.kind,
                        date: dayData.date,
                        ...(item.type && { runType: item.type }),
                        ...(item.distance && { distance: item.distance })
                    };
                    window.location.hash = '#/log';
                };
                
                dayCell.appendChild(activityEl);
            });
        }
        
        weekGrid.appendChild(dayCell);
    });
    
    container.appendChild(weekGrid);
    app.appendChild(container);
}

// Render Stats view
async function renderStats() {
    const app = document.getElementById('app');
    const container = createElement('div', { className: 'view' });
    
    container.appendChild(createElement('h1', { textContent: 'Stats' }));
    
    const startDate = await getMeta('startDate');
    const units = await getMeta('units') || 'mi';
    
    if (!startDate) {
        container.appendChild(createElement('div', { className: 'card' }, [
            createElement('p', { textContent: 'No data yet. Start logging activities to see stats.' })
        ]));
        app.appendChild(container);
        return;
    }
    
    // Weekly totals
    const weeklyTotals = await getWeeklyTotals(startDate);
    if (weeklyTotals.length > 0) {
        const section = createElement('div', { className: 'stats-section' });
        section.appendChild(createElement('h2', { textContent: 'Weekly Run Totals' }));
        
        const table = createElement('table', { className: 'stats-table' });
        const thead = createElement('thead');
        thead.appendChild(createElement('tr', {}, [
            createElement('th', { textContent: 'Week' }),
            createElement('th', { textContent: 'Runs' }),
            createElement('th', { textContent: 'Distance' }),
            createElement('th', { textContent: 'Duration' })
        ]));
        table.appendChild(thead);
        
        const tbody = createElement('tbody');
        weeklyTotals.forEach(week => {
            const row = createElement('tr');
            row.appendChild(createElement('td', { textContent: week.week }));
            row.appendChild(createElement('td', { textContent: week.count }));
            row.appendChild(createElement('td', { textContent: formatDistance(week.distance, units) }));
            row.appendChild(createElement('td', { textContent: formatDuration(week.duration) }));
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        section.appendChild(table);
        container.appendChild(section);
    }
    
    // Long run trend
    const longRunTrend = await getLongRunTrend(8);
    if (longRunTrend.length > 0) {
        const section = createElement('div', { className: 'stats-section' });
        section.appendChild(createElement('h2', { textContent: 'Long Run Trend (Last 8)' }));
        const list = createElement('ul', { className: 'trend-list' });
        longRunTrend.forEach(run => {
            list.appendChild(createElement('li', { className: 'trend-item' }, [
                createElement('span', { textContent: formatDate(run.date) }),
                createElement('span', { textContent: formatDistance(run.distance, units) + (run.duration ? ` (${formatDuration(run.duration)})` : '') })
            ]));
        });
        section.appendChild(list);
        container.appendChild(section);
    }
    
    // Knee pain trend
    const kneePainTrend = await getKneePainTrend(14);
    if (kneePainTrend.length > 0) {
        const section = createElement('div', { className: 'stats-section' });
        section.appendChild(createElement('h2', { textContent: 'Knee Pain Trend (Last 14)' }));
        const list = createElement('ul', { className: 'trend-list' });
        kneePainTrend.forEach(entry => {
            const painLevel = entry.pain <= 3 ? 'Low' : entry.pain <= 6 ? 'Moderate' : 'High';
            list.appendChild(createElement('li', { className: 'trend-item' }, [
                createElement('span', { textContent: formatDate(entry.date) + ` - ${entry.kind}` }),
                createElement('span', { textContent: `Pain: ${entry.pain}/10 (${painLevel})` })
            ]));
        });
        section.appendChild(list);
        container.appendChild(section);
    }
    
    // Lift progress
    const goalProgress = await getGoalProgressData();
    const section = createElement('div', { className: 'stats-section' });
    section.appendChild(createElement('h2', { textContent: 'Lift Progress' }));
    
    ['bench', 'squat', 'deadlift'].forEach(lift => {
        const data = goalProgress[lift];
        const progressItem = createElement('div', { className: 'progress-item' });
        
        const label = createElement('div', { className: 'progress-label' }, [
            createElement('span', { textContent: lift.charAt(0).toUpperCase() + lift.slice(1) }),
            createElement('span', { textContent: `${data.current} / ${data.target} lbs` })
        ]);
        progressItem.appendChild(label);
        
        const progressBar = createElement('div', { className: 'progress-bar-container' });
        const progressFill = createElement('div', {
            className: `progress-bar-fill ${data.progress >= 100 ? 'success' : data.progress >= 75 ? 'warning' : ''}`,
            style: `width: ${data.progress}%`
        }, [
            createElement('span', { textContent: `${data.progress}%` })
        ]);
        progressBar.appendChild(progressFill);
        progressItem.appendChild(progressBar);
        
        if (data.bestSet) {
            progressItem.appendChild(createElement('div', {
                style: 'font-size: 13px; color: var(--text-secondary); margin-top: 4px;',
                textContent: `Best: ${data.bestSet.weight}lbs x ${data.bestSet.reps} (est. 1RM: ${data.current}lbs)`
            }));
        }
        
        section.appendChild(progressItem);
    });
    
    container.appendChild(section);
    app.appendChild(container);
}

// Render Settings view
async function renderSettings() {
    const app = document.getElementById('app');
    const container = createElement('div', { className: 'view' });
    
    container.appendChild(createElement('h1', { textContent: 'Settings' }));
    
    // Start date
    const startDateSection = createElement('div', { className: 'settings-section' });
    startDateSection.appendChild(createElement('h2', { textContent: 'Plan Configuration' }));
    
    const startDateItem = createElement('div', { className: 'settings-item' });
    startDateItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Plan Start Date' }));
    const startDateValue = createElement('div', { className: 'settings-value' });
    const startDateInput = createElement('input', {
        type: 'date',
        id: 'startDate',
        style: 'font-size: 15px;'
    });
    const currentStartDate = await getMeta('startDate');
    if (currentStartDate) {
        startDateInput.value = currentStartDate;
    }
    startDateInput.onchange = async () => {
        await setMeta('startDate', startDateInput.value);
        alert('Start date saved!');
    };
    startDateValue.appendChild(startDateInput);
    startDateItem.appendChild(startDateValue);
    startDateSection.appendChild(startDateItem);
    
    // Units
    const unitsItem = createElement('div', { className: 'settings-item' });
    unitsItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Units' }));
    const unitsValue = createElement('div', { className: 'settings-value' });
    const unitsSelect = createElement('select', {
        id: 'units',
        style: 'font-size: 15px; padding: 8px;'
    });
    const currentUnits = await getMeta('units') || 'mi';
    ['mi', 'km'].forEach(unit => {
        const option = createElement('option', { value: unit, textContent: unit === 'mi' ? 'Miles' : 'Kilometers' });
        if (unit === currentUnits) option.selected = true;
        unitsSelect.appendChild(option);
    });
    unitsSelect.onchange = async () => {
        await setMeta('units', unitsSelect.value);
    };
    unitsValue.appendChild(unitsSelect);
    unitsItem.appendChild(unitsValue);
    startDateSection.appendChild(unitsItem);
    
    // Long run day
    const longRunDayItem = createElement('div', { className: 'settings-item' });
    longRunDayItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Long Run Day' }));
    const longRunDayValue = createElement('div', { className: 'settings-value' });
    const longRunDaySelect = createElement('select', {
        id: 'longRunDay',
        style: 'font-size: 15px; padding: 8px;'
    });
    const currentDay = await getMeta('longRunDay') || 'saturday';
    ['saturday', 'sunday'].forEach(day => {
        const option = createElement('option', { value: day, textContent: day.charAt(0).toUpperCase() + day.slice(1) });
        if (day === currentDay) option.selected = true;
        longRunDaySelect.appendChild(option);
    });
    longRunDaySelect.onchange = async () => {
        await setMeta('longRunDay', longRunDaySelect.value);
        alert('Long run day saved!');
    };
    longRunDayValue.appendChild(longRunDaySelect);
    longRunDayItem.appendChild(longRunDayValue);
    startDateSection.appendChild(longRunDayItem);
    
    container.appendChild(startDateSection);
    
    // Data management
    const dataSection = createElement('div', { className: 'settings-section' });
    dataSection.appendChild(createElement('h2', { textContent: 'Data Management' }));
    
    // Export
    const exportItem = createElement('div', { className: 'settings-item' });
    exportItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Export Data' }));
    const exportBtn = createElement('button', {
        className: 'btn btn-primary',
        textContent: 'Export JSON',
        onclick: async () => {
            try {
                const data = await exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = createElement('a', {
                    href: url,
                    download: `marathon-tracker-export-${getDateString(new Date())}.json`
                });
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                alert('Error exporting data: ' + error.message);
            }
        }
    });
    exportItem.appendChild(exportBtn);
    dataSection.appendChild(exportItem);
    
    // Import
    const importItem = createElement('div', { className: 'settings-item' });
    importItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Import Data' }));
    const importInput = createElement('input', {
        type: 'file',
        accept: 'application/json',
        style: 'font-size: 15px;'
    });
    importInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (confirm('This will replace all existing data. Continue?')) {
                await importData(data);
                alert('Data imported successfully!');
                window.location.hash = '#/today';
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
        importInput.value = '';
    };
    importItem.appendChild(importInput);
    dataSection.appendChild(importItem);
    
    // Reset
    const resetItem = createElement('div', { className: 'settings-item' });
    resetItem.appendChild(createElement('div', { className: 'settings-label', textContent: 'Reset All Data' }));
    const resetBtn = createElement('button', {
        className: 'btn btn-danger',
        textContent: 'Reset',
        onclick: async () => {
            if (confirm('Are you sure? This will delete ALL data and cannot be undone!')) {
                if (confirm('Last chance! This is permanent!')) {
                    try {
                        await clearAll();
                        alert('All data has been reset.');
                        window.location.hash = '#/today';
                    } catch (error) {
                        alert('Error resetting data: ' + error.message);
                    }
                }
            }
        }
    });
    resetItem.appendChild(resetBtn);
    dataSection.appendChild(resetItem);
    
    container.appendChild(dataSection);
    
    // PWA instructions
    const pwaSection = createElement('div', { className: 'settings-section' });
    pwaSection.appendChild(createElement('h2', { textContent: 'Install as App' }));
    
    const collapsible = createElement('div', { className: 'collapsible' });
    const header = createElement('div', {
        className: 'collapsible-header',
        textContent: 'How to install on iPhone',
        onclick: () => {
            const content = collapsible.querySelector('.collapsible-content');
            content.classList.toggle('open');
        }
    });
    collapsible.appendChild(header);
    
    const content = createElement('div', { className: 'collapsible-content' }, [
        createElement('ol', { style: 'padding-left: 20px;' }, [
            createElement('li', { textContent: 'Open this app in Safari (not Chrome)' }),
            createElement('li', { textContent: 'Tap the Share button (square with arrow)' }),
            createElement('li', { textContent: 'Scroll down and tap "Add to Home Screen"' }),
            createElement('li', { textContent: 'Tap "Add" to confirm' }),
            createElement('li', { textContent: 'The app will now appear on your home screen and work offline' })
        ])
    ]);
    collapsible.appendChild(content);
    pwaSection.appendChild(collapsible);
    
    container.appendChild(pwaSection);
    
    app.appendChild(container);
}

// Render Workout Guide
function renderWorkoutGuide() {
    const app = document.getElementById('app');
    const container = createElement('div', { className: 'view' });
    
    const header = createElement('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;' });
    header.appendChild(createElement('h1', { textContent: 'Workout Guide', style: 'margin: 0;' }));
    const backBtn = createElement('button', {
        className: 'btn btn-secondary',
        textContent: '← Back to Plan',
        onclick: () => {
            window.location.hash = '#/plan';
        }
    });
    header.appendChild(backBtn);
    container.appendChild(header);
    
    // Runs section
    const runsSection = createElement('div', { className: 'card', style: 'margin-bottom: 16px;' });
    runsSection.appendChild(createElement('h2', { textContent: '🏃 Running Workouts' }));
    
    // Easy Run
    const easyCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
    easyCard.appendChild(createElement('h3', { textContent: 'Easy Run' }));
    easyCard.appendChild(createElement('p', { textContent: WORKOUT_GUIDE.runs.easy.description, style: 'margin: 8px 0;' }));
    easyCard.appendChild(createElement('p', { textContent: WORKOUT_GUIDE.runs.easy.example, style: 'margin: 8px 0; font-weight: 500;' }));
    const easyTips = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px;' });
    WORKOUT_GUIDE.runs.easy.tips.forEach(tip => {
        easyTips.appendChild(createElement('li', { textContent: tip, style: 'margin: 4px 0;' }));
    });
    easyCard.appendChild(easyTips);
    runsSection.appendChild(easyCard);
    
    // Long Run
    const longCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
    longCard.appendChild(createElement('h3', { textContent: 'Long Run' }));
    longCard.appendChild(createElement('p', { textContent: WORKOUT_GUIDE.runs.long.description, style: 'margin: 8px 0;' }));
    longCard.appendChild(createElement('p', { textContent: WORKOUT_GUIDE.runs.long.howTo, style: 'margin: 8px 0; font-weight: 500;' }));
    const longTips = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px;' });
    WORKOUT_GUIDE.runs.long.tips.forEach(tip => {
        longTips.appendChild(createElement('li', { textContent: tip, style: 'margin: 4px 0;' }));
    });
    longCard.appendChild(longTips);
    runsSection.appendChild(longCard);
    
    // Quality Runs
    const qualityCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
    qualityCard.appendChild(createElement('h3', { textContent: 'Quality Runs' }));
    qualityCard.appendChild(createElement('p', { textContent: WORKOUT_GUIDE.runs.quality.description, style: 'margin: 8px 0;' }));
    
    Object.entries(WORKOUT_GUIDE.runs.quality.examples).forEach(([key, workout]) => {
        const workoutDiv = createElement('div', { style: 'margin: 12px 0; padding: 10px; background: white; border-radius: 6px; border-left: 3px solid var(--primary-color);' });
        workoutDiv.appendChild(createElement('h4', { textContent: workout.title, style: 'margin: 0 0 6px 0;' }));
        workoutDiv.appendChild(createElement('p', { textContent: workout.description, style: 'margin: 4px 0; font-weight: 500;' }));
        workoutDiv.appendChild(createElement('p', { textContent: workout.howTo, style: 'margin: 4px 0;' }));
        if (workout.pace) {
            workoutDiv.appendChild(createElement('p', { textContent: 'Pace: ' + workout.pace, style: 'margin: 4px 0; font-size: 14px; color: var(--text-secondary);' }));
        }
        if (workout.tips) {
            const tipsList = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px; font-size: 14px;' });
            workout.tips.forEach(tip => {
                tipsList.appendChild(createElement('li', { textContent: tip, style: 'margin: 2px 0;' }));
            });
            workoutDiv.appendChild(tipsList);
        }
        qualityCard.appendChild(workoutDiv);
    });
    runsSection.appendChild(qualityCard);
    container.appendChild(runsSection);
    
    // Lifts section
    const liftsSection = createElement('div', { className: 'card', style: 'margin-bottom: 16px;' });
    liftsSection.appendChild(createElement('h2', { textContent: '💪 Lifting Exercises' }));
    
    Object.entries(WORKOUT_GUIDE.lifts).forEach(([key, lift]) => {
        const liftCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
        liftCard.appendChild(createElement('h3', { textContent: lift.title }));
        
        // Add exercise GIF
        const gifName = key === 'rdl' ? 'rdl' : key;
                            const img = createElement('img', {
                                src: `/pwa/exercises/${gifName}.gif`,
                                alt: lift.title,
                                style: 'max-width: 100%; height: auto; margin: 12px 0; border-radius: 8px; display: block;',
                                onerror: function() {
                                    // Silently hide missing images to avoid 404 noise
                                    this.style.display = 'none';
                                    this.onerror = null; // Prevent repeated error handling
                                },
                                onload: function() {
                                    // Only show if image loads successfully
                                    this.style.display = 'block';
                                }
                            });
        liftCard.appendChild(img);
        
        liftCard.appendChild(createElement('p', { textContent: lift.description, style: 'margin: 8px 0;' }));
        const howToList = createElement('ol', { style: 'margin: 8px 0; padding-left: 20px;' });
        lift.howTo.forEach(step => {
            howToList.appendChild(createElement('li', { textContent: step, style: 'margin: 4px 0;' }));
        });
        liftCard.appendChild(howToList);
        if (lift.tips) {
            const tipsList = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px;' });
            lift.tips.forEach(tip => {
                tipsList.appendChild(createElement('li', { textContent: tip, style: 'margin: 4px 0; font-size: 14px;' }));
            });
            liftCard.appendChild(tipsList);
        }
        if (lift.imageNote) {
            liftCard.appendChild(createElement('p', { 
                textContent: '💡 ' + lift.imageNote, 
                style: 'margin: 8px 0; font-size: 13px; color: var(--text-secondary); font-style: italic;' 
            }));
        }
        liftsSection.appendChild(liftCard);
    });
    container.appendChild(liftsSection);
    
    // Knee exercises section
    const kneeSection = createElement('div', { className: 'card', style: 'margin-bottom: 16px;' });
    kneeSection.appendChild(createElement('h2', { textContent: '🦵 Knee Resilience Exercises' }));
    
    Object.entries(WORKOUT_GUIDE.knee).forEach(([key, exercise]) => {
        const exCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
        exCard.appendChild(createElement('h3', { textContent: exercise.title }));
        
        // Add exercise GIF
        const gifName = key === 'stepDowns' ? 'step-downs' : key === 'bandWalks' ? 'band-walks' : key === 'wallSit' ? 'wall-sit' : key;
        const img = createElement('img', {
            src: `/pwa/exercises/${gifName}.gif`,
            alt: exercise.title,
            style: 'max-width: 100%; height: auto; margin: 12px 0; border-radius: 8px; display: block;',
            onerror: function() {
                this.style.display = 'none';
            }
        });
        exCard.appendChild(img);
        
        exCard.appendChild(createElement('p', { textContent: exercise.description, style: 'margin: 8px 0;' }));
        const howToList = createElement('ol', { style: 'margin: 8px 0; padding-left: 20px;' });
        exercise.howTo.forEach(step => {
            howToList.appendChild(createElement('li', { textContent: step, style: 'margin: 4px 0;' }));
        });
        exCard.appendChild(howToList);
        if (exercise.tips) {
            const tipsList = createElement('ul', { style: 'margin: 8px 0; padding-left: 20px;' });
            exercise.tips.forEach(tip => {
                tipsList.appendChild(createElement('li', { textContent: tip, style: 'margin: 4px 0; font-size: 14px;' }));
            });
            exCard.appendChild(tipsList);
        }
        if (exercise.imageNote) {
            exCard.appendChild(createElement('p', { 
                textContent: '💡 ' + exercise.imageNote, 
                style: 'margin: 8px 0; font-size: 13px; color: var(--text-secondary); font-style: italic;' 
            }));
        }
        kneeSection.appendChild(exCard);
    });
    container.appendChild(kneeSection);
    
    // Mobility section
    const mobilitySection = createElement('div', { className: 'card' });
    mobilitySection.appendChild(createElement('h2', { textContent: '🧘 Mobility Exercises' }));
    
    Object.entries(WORKOUT_GUIDE.mobility).forEach(([key, exercise]) => {
        const exCard = createElement('div', { style: 'margin-bottom: 16px; padding: 12px; background: var(--bg-color); border-radius: 8px;' });
        exCard.appendChild(createElement('h3', { textContent: exercise.title }));
        
        // Add exercise GIF
        const gifName = key === 'hips9090' ? 'hips-9090' : key === 'hamstringFloss' ? 'hamstring-floss' : key === 'ankleRocks' ? 'ankle-rocks' : key === 'calfStretch' ? 'calf-stretch' : key === 'couchStretch' ? 'couch-stretch' : key;
        const img = createElement('img', {
            src: `/pwa/exercises/${gifName}.gif`,
            alt: exercise.title,
            style: 'max-width: 100%; height: auto; margin: 12px 0; border-radius: 8px; display: block;',
            onerror: function() {
                this.style.display = 'none';
            }
        });
        exCard.appendChild(img);
        
        exCard.appendChild(createElement('p', { textContent: exercise.description, style: 'margin: 8px 0;' }));
        const howToList = createElement('ol', { style: 'margin: 8px 0; padding-left: 20px;' });
        exercise.howTo.forEach(step => {
            howToList.appendChild(createElement('li', { textContent: step, style: 'margin: 4px 0;' }));
        });
        exCard.appendChild(howToList);
        if (exercise.imageNote) {
            exCard.appendChild(createElement('p', { 
                textContent: '💡 ' + exercise.imageNote, 
                style: 'margin: 8px 0; font-size: 13px; color: var(--text-secondary); font-style: italic;' 
            }));
        }
        mobilitySection.appendChild(exCard);
    });
    container.appendChild(mobilitySection);
    
    app.innerHTML = '';
    app.className = 'view';
    app.appendChild(container);
}

// Initialize on load
function startApp() {
    // Verify required functions exist
    if (typeof createElement === 'undefined') {
        console.error('ui.js not loaded!');
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '<div class="view"><h1>Error</h1><p>Required scripts not loaded. Please refresh the page.</p></div>';
        }
        return;
    }
    
    if (typeof initDB === 'undefined') {
        console.error('db.js not loaded!');
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '<div class="view"><h1>Error</h1><p>Database script not loaded. Please refresh the page.</p></div>';
        }
        return;
    }
    
    try {
        init().catch(err => {
            console.error('App initialization error:', err);
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = '<div class="view"><h1>Error</h1><p>Failed to initialize app. Please refresh the page.</p><p style="color: red; font-size: 14px;">' + (err.message || String(err)) + '</p><p style="font-size: 12px; margin-top: 16px;">Check the browser console for more details.</p></div>';
            }
        });
    } catch (err) {
        console.error('Startup error:', err);
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '<div class="view"><h1>Error</h1><p>Startup failed: ' + (err.message || String(err)) + '</p></div>';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    // DOM already loaded, start immediately
    startApp();
}

