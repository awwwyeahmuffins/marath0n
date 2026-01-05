// UI helpers and form components

// Create DOM element
function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'textContent') {
            el.textContent = value;
        } else if (key === 'innerHTML') {
            el.innerHTML = value;
        } else if (key.startsWith('on')) {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child) {
            el.appendChild(child);
        }
    });
    
    return el;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateOnly.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }
    
    const daysDiff = Math.floor((today - dateOnly) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

// Format duration (minutes to "1h 30m")
function formatDuration(minutes) {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${mins}m`;
    }
}

// Format distance
function formatDistance(miles, units = 'mi') {
    if (!miles && miles !== 0) return '';
    if (units === 'km') {
        const km = (miles * 1.60934).toFixed(1);
        return `${km} km`;
    }
    return `${miles.toFixed(1)} mi`;
}

// Create run form
function createRunForm(prefill = {}) {
    const form = createElement('form', { className: 'view' });
    
    const typeGroup = createElement('div', { className: 'form-group' });
    typeGroup.appendChild(createElement('label', { textContent: 'Run Type' }));
    const typeSelect = createElement('select', { name: 'runType', required: true });
    ['easy', 'quality', 'long'].forEach(type => {
        const option = createElement('option', { value: type, textContent: type.charAt(0).toUpperCase() + type.slice(1) });
        if (prefill.runType === type) option.selected = true;
        typeSelect.appendChild(option);
    });
    typeGroup.appendChild(typeSelect);
    form.appendChild(typeGroup);
    
    const dateGroup = createElement('div', { className: 'form-group' });
    dateGroup.appendChild(createElement('label', { textContent: 'Date' }));
    const dateInput = createElement('input', {
        type: 'date',
        name: 'date',
        value: prefill.date || getDateString(new Date()),
        required: true
    });
    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);
    
    const distanceGroup = createElement('div', { className: 'form-group' });
    distanceGroup.appendChild(createElement('label', { textContent: 'Distance (miles)' }));
    const distanceInput = createElement('input', {
        type: 'number',
        name: 'distance',
        step: '0.1',
        inputMode: 'decimal',
        placeholder: 'e.g., 5.5'
    });
    if (prefill.distance) distanceInput.value = prefill.distance;
    distanceGroup.appendChild(distanceInput);
    form.appendChild(distanceGroup);
    
    const durationGroup = createElement('div', { className: 'form-group' });
    durationGroup.appendChild(createElement('label', { textContent: 'Duration (minutes)' }));
    const durationInput = createElement('input', {
        type: 'number',
        name: 'durationMin',
        step: '1',
        inputMode: 'numeric',
        placeholder: 'e.g., 45'
    });
    if (prefill.durationMin) durationInput.value = prefill.durationMin;
    durationGroup.appendChild(durationInput);
    form.appendChild(durationGroup);
    
    const kneePainGroup = createElement('div', { className: 'form-group' });
    kneePainGroup.appendChild(createElement('label', { textContent: 'Knee Pain (0-10, optional)' }));
    const kneePainInput = createElement('input', {
        type: 'number',
        name: 'kneePain',
        min: '0',
        max: '10',
        step: '1',
        inputMode: 'numeric',
        placeholder: '0-10'
    });
    if (prefill.kneePain !== undefined) kneePainInput.value = prefill.kneePain;
    kneePainGroup.appendChild(kneePainInput);
    form.appendChild(kneePainGroup);
    
    const notesGroup = createElement('div', { className: 'form-group' });
    notesGroup.appendChild(createElement('label', { textContent: 'Notes (optional)' }));
    const notesInput = createElement('textarea', { name: 'notes', rows: '3' });
    if (prefill.notes) notesInput.value = prefill.notes;
    notesGroup.appendChild(notesInput);
    form.appendChild(notesGroup);
    
    return form;
}

// Create lift form
function createLiftForm(prefill = {}) {
    const form = createElement('form', { className: 'view' });
    
    const dateGroup = createElement('div', { className: 'form-group' });
    dateGroup.appendChild(createElement('label', { textContent: 'Date' }));
    const dateInput = createElement('input', {
        type: 'date',
        name: 'date',
        value: prefill.date || getDateString(new Date()),
        required: true
    });
    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);
    
    const liftsContainer = createElement('div', { id: 'liftsContainer' });
    form.appendChild(liftsContainer);
    
    const addLiftBtn = createElement('button', {
        type: 'button',
        className: 'btn btn-secondary',
        textContent: '+ Add Lift'
    });
    
    const lifts = prefill.lifts && prefill.lifts.length > 0 ? prefill.lifts : [{ name: 'bench', weight: '', sets: '', reps: '' }];
    
    function addLiftEntry(lift = {}) {
        const entry = createElement('div', { className: 'lift-entry' });
        
        const header = createElement('div', { className: 'lift-entry-header' });
        const nameSelect = createElement('select', { name: 'liftName', required: true });
        ['bench', 'squat', 'deadlift', 'press'].forEach(name => {
            const option = createElement('option', { value: name, textContent: name.charAt(0).toUpperCase() + name.slice(1) });
            if (lift.name === name) option.selected = true;
            nameSelect.appendChild(option);
        });
        header.appendChild(nameSelect);
        
        const removeBtn = createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            textContent: 'Remove',
            style: 'font-size: 14px; padding: 8px 12px;'
        });
        removeBtn.onclick = () => entry.remove();
        header.appendChild(removeBtn);
        entry.appendChild(header);
        
        const fields = createElement('div', { className: 'lift-entry-fields' });
        
        const weightInput = createElement('input', {
            type: 'number',
            name: 'weight',
            placeholder: 'Weight',
            step: '2.5',
            inputMode: 'decimal',
            required: true
        });
        if (lift.weight) weightInput.value = lift.weight;
        fields.appendChild(createElement('div', {}, [
            createElement('label', { textContent: 'Weight (lbs)', style: 'font-size: 13px;' }),
            weightInput
        ]));
        
        const setsInput = createElement('input', {
            type: 'number',
            name: 'sets',
            placeholder: 'Sets',
            step: '1',
            inputMode: 'numeric',
            required: true
        });
        if (lift.sets) setsInput.value = lift.sets;
        fields.appendChild(createElement('div', {}, [
            createElement('label', { textContent: 'Sets', style: 'font-size: 13px;' }),
            setsInput
        ]));
        
        const repsInput = createElement('input', {
            type: 'number',
            name: 'reps',
            placeholder: 'Reps',
            step: '1',
            inputMode: 'numeric',
            required: true
        });
        if (lift.reps) repsInput.value = lift.reps;
        fields.appendChild(createElement('div', {}, [
            createElement('label', { textContent: 'Reps', style: 'font-size: 13px;' }),
            repsInput
        ]));
        
        entry.appendChild(fields);
        liftsContainer.appendChild(entry);
    }
    
    lifts.forEach(lift => addLiftEntry(lift));
    
    addLiftBtn.onclick = () => addLiftEntry();
    form.appendChild(addLiftBtn);
    
    const rpeGroup = createElement('div', { className: 'form-group' });
    rpeGroup.appendChild(createElement('label', { textContent: 'RPE (1-10, optional)' }));
    const rpeInput = createElement('input', {
        type: 'number',
        name: 'rpe',
        min: '1',
        max: '10',
        step: '1',
        inputMode: 'numeric',
        placeholder: '1-10'
    });
    if (prefill.rpe !== undefined) rpeInput.value = prefill.rpe;
    rpeGroup.appendChild(rpeInput);
    form.appendChild(rpeGroup);
    
    const kneePainGroup = createElement('div', { className: 'form-group' });
    kneePainGroup.appendChild(createElement('label', { textContent: 'Knee Pain (0-10, optional)' }));
    const kneePainInput = createElement('input', {
        type: 'number',
        name: 'kneePain',
        min: '0',
        max: '10',
        step: '1',
        inputMode: 'numeric',
        placeholder: '0-10'
    });
    if (prefill.kneePain !== undefined) kneePainInput.value = prefill.kneePain;
    kneePainGroup.appendChild(kneePainInput);
    form.appendChild(kneePainGroup);
    
    const notesGroup = createElement('div', { className: 'form-group' });
    notesGroup.appendChild(createElement('label', { textContent: 'Notes (optional)' }));
    const notesInput = createElement('textarea', { name: 'notes', rows: '3' });
    if (prefill.notes) notesInput.value = prefill.notes;
    notesGroup.appendChild(notesInput);
    form.appendChild(notesGroup);
    
    return form;
}

// Create knee circuit form
function createKneeForm(prefill = {}) {
    const form = createElement('form', { className: 'view' });
    
    const dateGroup = createElement('div', { className: 'form-group' });
    dateGroup.appendChild(createElement('label', { textContent: 'Date' }));
    const dateInput = createElement('input', {
        type: 'date',
        name: 'date',
        value: prefill.date || getDateString(new Date()),
        required: true
    });
    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);
    
    const wallSitGroup = createElement('div', { className: 'form-group' });
    wallSitGroup.appendChild(createElement('label', { textContent: 'Wall Sits' }));
    const wallSitContainer = createElement('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;' });
    const wallSitSets = createElement('input', {
        type: 'number',
        name: 'wallSitSets',
        placeholder: 'Sets',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.wallSitSets) wallSitSets.value = prefill.wallSitSets;
    const wallSitSec = createElement('input', {
        type: 'number',
        name: 'wallSitSec',
        placeholder: 'Seconds',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.wallSitSec) wallSitSec.value = prefill.wallSitSec;
    wallSitContainer.appendChild(wallSitSets);
    wallSitContainer.appendChild(wallSitSec);
    wallSitGroup.appendChild(wallSitContainer);
    form.appendChild(wallSitGroup);
    
    const stepDownGroup = createElement('div', { className: 'form-group' });
    stepDownGroup.appendChild(createElement('label', { textContent: 'Step-downs' }));
    const stepDownContainer = createElement('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;' });
    const stepDownSets = createElement('input', {
        type: 'number',
        name: 'stepDownSets',
        placeholder: 'Sets',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.stepDownSets) stepDownSets.value = prefill.stepDownSets;
    const stepDownReps = createElement('input', {
        type: 'number',
        name: 'stepDownRepsEach',
        placeholder: 'Reps each leg',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.stepDownRepsEach) stepDownReps.value = prefill.stepDownRepsEach;
    stepDownContainer.appendChild(stepDownSets);
    stepDownContainer.appendChild(stepDownReps);
    stepDownGroup.appendChild(stepDownContainer);
    form.appendChild(stepDownGroup);
    
    const soleusGroup = createElement('div', { className: 'form-group' });
    soleusGroup.appendChild(createElement('label', { textContent: 'Soleus Raises' }));
    const soleusContainer = createElement('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;' });
    const soleusSets = createElement('input', {
        type: 'number',
        name: 'soleusSets',
        placeholder: 'Sets',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.soleusSets) soleusSets.value = prefill.soleusSets;
    const soleusReps = createElement('input', {
        type: 'number',
        name: 'soleusReps',
        placeholder: 'Reps',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.soleusReps) soleusReps.value = prefill.soleusReps;
    soleusContainer.appendChild(soleusSets);
    soleusContainer.appendChild(soleusReps);
    soleusGroup.appendChild(soleusContainer);
    form.appendChild(soleusGroup);
    
    const bandWalkGroup = createElement('div', { className: 'form-group' });
    bandWalkGroup.appendChild(createElement('label', { textContent: 'Band Walks' }));
    const bandWalkContainer = createElement('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;' });
    const bandWalkSets = createElement('input', {
        type: 'number',
        name: 'bandWalkSets',
        placeholder: 'Sets',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.bandWalkSets) bandWalkSets.value = prefill.bandWalkSets;
    const bandWalkSteps = createElement('input', {
        type: 'number',
        name: 'bandWalkSteps',
        placeholder: 'Steps',
        step: '1',
        inputMode: 'numeric'
    });
    if (prefill.bandWalkSteps) bandWalkSteps.value = prefill.bandWalkSteps;
    bandWalkContainer.appendChild(bandWalkSets);
    bandWalkContainer.appendChild(bandWalkSteps);
    bandWalkGroup.appendChild(bandWalkContainer);
    form.appendChild(bandWalkGroup);
    
    const kneePainGroup = createElement('div', { className: 'form-group' });
    kneePainGroup.appendChild(createElement('label', { textContent: 'Knee Pain (0-10, optional)' }));
    const kneePainInput = createElement('input', {
        type: 'number',
        name: 'kneePain',
        min: '0',
        max: '10',
        step: '1',
        inputMode: 'numeric',
        placeholder: '0-10'
    });
    if (prefill.kneePain !== undefined) kneePainInput.value = prefill.kneePain;
    kneePainGroup.appendChild(kneePainInput);
    form.appendChild(kneePainGroup);
    
    const notesGroup = createElement('div', { className: 'form-group' });
    notesGroup.appendChild(createElement('label', { textContent: 'Notes (optional)' }));
    const notesInput = createElement('textarea', { name: 'notes', rows: '3' });
    if (prefill.notes) notesInput.value = prefill.notes;
    notesGroup.appendChild(notesInput);
    form.appendChild(notesGroup);
    
    return form;
}

// Create mobility form
function createMobilityForm(prefill = {}) {
    const form = createElement('form', { className: 'view' });
    
    const dateGroup = createElement('div', { className: 'form-group' });
    dateGroup.appendChild(createElement('label', { textContent: 'Date' }));
    const dateInput = createElement('input', {
        type: 'date',
        name: 'date',
        value: prefill.date || getDateString(new Date()),
        required: true
    });
    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);
    
    const exercises = [
        { key: 'couchStretch', label: 'Couch Stretch' },
        { key: 'calfStretch', label: 'Calf Stretch' },
        { key: 'hamstringFloss', label: 'Hamstring Floss' },
        { key: 'ankleRocks', label: 'Ankle Rocks' },
        { key: 'hips9090', label: 'Hips 90/90' }
    ];
    
    exercises.forEach(ex => {
        const checkboxGroup = createElement('div', { className: 'checkbox-group' });
        const checkbox = createElement('input', {
            type: 'checkbox',
            name: ex.key,
            id: ex.key
        });
        if (prefill[ex.key]) checkbox.checked = true;
        checkboxGroup.appendChild(checkbox);
        checkboxGroup.appendChild(createElement('label', { htmlFor: ex.key, textContent: ex.label }));
        form.appendChild(checkboxGroup);
    });
    
    const minutesGroup = createElement('div', { className: 'form-group' });
    minutesGroup.appendChild(createElement('label', { textContent: 'Total Minutes' }));
    const minutesInput = createElement('input', {
        type: 'number',
        name: 'minutes',
        step: '1',
        inputMode: 'numeric',
        placeholder: 'e.g., 15'
    });
    if (prefill.minutes) minutesInput.value = prefill.minutes;
    minutesGroup.appendChild(minutesInput);
    form.appendChild(minutesGroup);
    
    const notesGroup = createElement('div', { className: 'form-group' });
    notesGroup.appendChild(createElement('label', { textContent: 'Notes (optional)' }));
    const notesInput = createElement('textarea', { name: 'notes', rows: '3' });
    if (prefill.notes) notesInput.value = prefill.notes;
    notesGroup.appendChild(notesInput);
    form.appendChild(notesGroup);
    
    return form;
}

// Get date string helper (from plan.js)
function getDateString(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

