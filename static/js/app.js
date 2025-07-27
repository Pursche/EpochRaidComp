/**
 * Main Application JavaScript
 * WoW Raid Composition Planner
 */

// Global state
let specializations = [];
let specializationsByClass = {}; // Cache for grouping by class
let raidGroups = [];
let raidEffects = [];
let specializationCache = new Map(); // Cache for loaded specializations
let isDirty = false; // Track if composition has been modified since last save/load

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        showLoading();
        await loadSpecializations();
        createGroupsUI();
        setupEventListeners();
        await displaySpecializations();
        updateRaidEffects();
        await refreshGroupEffects();
        
        // Load saved composition if available
        if (hasSavedComposition()) {
            console.log('Found saved composition, loading...');
            loadComposition();
        }
        
        // Setup header controls
        setupHeaderControls();
        
        showSuccess('Application loaded successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError(`Failed to load application data: ${error.message}`);
    }
}

/**
 * Load all specialization data from the server with enhanced error handling and caching
 */
async function loadSpecializations() {
    try {
        console.log('Loading specializations...');
        
        // Check cache first
        if (specializationCache.size > 0) {
            console.log('Using cached specializations');
            specializations = Array.from(specializationCache.values());
            groupSpecializationsByClass();
            displaySpecializations();
            return;
        }

        // Try to get list of specialization files from server
        let specializationFiles = [];
        try {
            const fileListResponse = await fetch('/specializations/');
            if (!fileListResponse.ok) {
                throw new Error(`Failed to get specialization list: HTTP ${fileListResponse.status}`);
            }
            
            specializationFiles = await fileListResponse.json();
            
            if (!Array.isArray(specializationFiles) || specializationFiles.length === 0) {
                throw new Error('No specialization files available');
            }

            console.log(`Found ${specializationFiles.length} specialization files via directory listing`);
        } catch (directoryError) {
            console.log('Directory listing failed, trying manifest.json fallback:', directoryError.message);
            
            // Try to load from manifest.json
            try {
                const manifestResponse = await fetch('/specializations/manifest.json');
                if (!manifestResponse.ok) {
                    throw new Error(`Failed to get manifest: HTTP ${manifestResponse.status}`);
                }
                
                const manifest = await manifestResponse.json();
                
                if (!manifest.files || !Array.isArray(manifest.files)) {
                    throw new Error('Invalid manifest structure - missing files array');
                }
                
                specializationFiles = manifest.files;
                console.log(`Found ${specializationFiles.length} specialization files via manifest.json`);
                
            } catch (manifestError) {
                console.log('Manifest.json also failed, using hardcoded fallback:', manifestError.message);
                throw new Error('Both directory listing and manifest.json failed');
            }
        }

        // Load each specialization file with enhanced error handling
        const loadPromises = specializationFiles.map(async (filename) => {
            return await loadSpecializationFile(filename);
        });

        // Wait for all files to load (with timeout)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading timeout - some files may not have loaded')), 10000);
        });

        const results = await Promise.race([
            Promise.allSettled(loadPromises),
            timeoutPromise
        ]);

        // Process results
        let loadedCount = 0;
        let errorCount = 0;

        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    specializations.push(result.value);
                    specializationCache.set(result.value.name, result.value);
                    loadedCount++;
                } else {
                    console.warn(`Failed to load ${specializationFiles[index]}:`, result.reason);
                    errorCount++;
                }
            });
        }

        // Group specializations by class
        groupSpecializationsByClass();
        
        // Display results
        displaySpecializations();
        
        console.log(`Specialization loading complete: ${loadedCount} loaded, ${errorCount} failed`);
        
        if (loadedCount === 0) {
            throw new Error('No valid specializations could be loaded');
        }

    } catch (error) {
        console.error('Error loading specializations:', error);
        
        // Fallback to hardcoded list if all other methods fail
        console.log('Falling back to hardcoded specialization list');
        await loadSpecializationsFallback();
    }
}

/**
 * Load a single specialization file with comprehensive error handling
 */
async function loadSpecializationFile(filename) {
    try {
        const response = await fetch(`/specializations/${filename}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Invalid content type: ${contentType}`);
        }

        const specData = await response.json();
        
        // Validate the specialization data
        if (window.SpecializationValidator && window.SpecializationValidator.validateSpecializationData(specData)) {
            console.log(`✅ Loaded ${filename}: ${specData.name}`);
            return specData;
        } else {
            const errors = window.SpecializationValidator ? 
                window.SpecializationValidator.getValidationErrors(specData) : 
                ['Validation failed'];
            throw new Error(`Invalid specialization data in ${filename}: ${errors.join(', ')}`);
        }
        
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error(`Network error loading ${filename}: ${error.message}`);
        } else if (error.name === 'SyntaxError') {
            throw new Error(`JSON parsing error in ${filename}: ${error.message}`);
        } else {
            throw new Error(`Error loading ${filename}: ${error.message}`);
        }
    }
}

/**
 * Fallback loading method using hardcoded file list
 */
async function loadSpecializationsFallback() {
    const fallbackFiles = [
        'druid_balance.json',
        'druid_feral.json',
        'druid_guardian.json',
        'druid_restoration.json',
        'hunter_beastmastery.json',
        'hunter_marksman.json',
        'hunter_survival.json',
        'mage_arcane.json',
        'mage_fire.json',
        'mage_frost.json',
        'paladin_holy.json',
        'paladin_protection.json',
        'paladin_retribution.json',
        'priest_discipline.json',
        'priest_holy.json',
        'priest_shadow.json',
        'rogue_assassination.json',
        'rogue_combat.json',
        'rogue_subtlety.json',
        'shaman_elemental.json',
        'shaman_enhancement.json',
        'shaman_restoration.json',
        'warlock_affliction.json',
        'warlock_demonology.json',
        'warlock_destruction.json',
        'warrior_arms.json',
        'warrior_fury.json',
        'warrior_protection.json'
    ];

    console.log('Using fallback file list:', fallbackFiles);

    for (const filename of fallbackFiles) {
        try {
            const specData = await loadSpecializationFile(filename);
            if (specData) {
                specializations.push(specData);
                specializationCache.set(specData.name, specData);
            }
        } catch (error) {
            console.warn(`Fallback loading failed for ${filename}:`, error.message);
        }
    }

    groupSpecializationsByClass();
    displaySpecializations();
}

/**
 * Group specializations by class for better organization
 */
function groupSpecializationsByClass() {
    specializationsByClass = {};
    
    specializations.forEach(spec => {
        const className = spec.class;
        if (!specializationsByClass[className]) {
            specializationsByClass[className] = [];
        }
        specializationsByClass[className].push(spec);
    });
    
    console.log('Specializations grouped by class:', Object.keys(specializationsByClass));
}

/**
 * Get specializations by class
 */
function getSpecializationsByClass(className) {
    return specializationsByClass[className] || [];
}

/**
 * Get all available classes
 */
function getAvailableClasses() {
    return Object.keys(specializationsByClass);
}

/**
 * Clear the specialization cache
 */
function clearSpecializationCache() {
    specializationCache.clear();
    specializations = [];
    specializationsByClass = {};
    console.log('Specialization cache cleared');
}

/**
 * Reload specializations (bypassing cache)
 */
async function reloadSpecializations() {
    clearSpecializationCache();
    await loadSpecializations();
}

/**
 * Display specializations in the UI grouped by class
 */
async function displaySpecializations() {
    const container = document.getElementById('specializations-container');
    if (!container) return;

    if (specializations.length === 0) {
        container.innerHTML = '<p>No specializations available</p>';
        return;
    }

    // Sort specializations by class first, then by specialization name
    const sortedSpecializations = specializations.sort((a, b) => {
        // First sort by class name
        if (a.class !== b.class) {
            return a.class.localeCompare(b.class);
        }
        // Then sort by specialization name within the same class
        return a.name.localeCompare(b.name);
    });

    // Display all specializations in a simple list without class grouping
    let html = '<div class="specializations-list">';
    
    // Create specialization cards with validated icons
    const specCards = await Promise.all(sortedSpecializations.map(async (spec) => {
        const validIconPath = await getValidIconPath(spec.icon_path);
        
        // Organize effects by scope for tooltip and count display
        const raidEffects = spec.effects.filter(effect => effect.scope === 'raid');
        const groupEffects = spec.effects.filter(effect => effect.scope === 'group');
        
        // Create effect count display with breakdown
        let effectCountDisplay = '';
        if (groupEffects.length > 0 && raidEffects.length > 0) {
            effectCountDisplay = `${groupEffects.length} group, ${raidEffects.length} raid effects`;
        } else if (groupEffects.length > 0) {
            effectCountDisplay = `${groupEffects.length} group effect${groupEffects.length > 1 ? 's' : ''}`;
        } else if (raidEffects.length > 0) {
            effectCountDisplay = `${raidEffects.length} raid effect${raidEffects.length > 1 ? 's' : ''}`;
        } else {
            effectCountDisplay = 'No effects';
        }
        
        // Create tooltip content with detailed descriptions
        let tooltipContent = '';
        if (raidEffects.length > 0) {
            tooltipContent += 'Raid Effects:\n' + raidEffects.map(effect => `${effect.name} - ${effect.description}`).join('\n');
        }
        if (groupEffects.length > 0) {
            if (tooltipContent) tooltipContent += '\n\n';
            tooltipContent += 'Group Effects:\n' + groupEffects.map(effect => `${effect.name} - ${effect.description}`).join('\n');
        }
        if (!tooltipContent) {
            tooltipContent = 'No effects';
        }
        
        return `
            <div class="specialization-card" data-spec-name="${spec.name}" data-class="${spec.class}">
                <div class="spec-header">
                    <div class="spec-icon" style="background-image: url(${validIconPath}); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
                    <div class="spec-info">
                        <h3>${spec.name}</h3>
                        <div class="effect-info-row">
                            <span class="effect-count">${effectCountDisplay}</span><span class="effect-info-icon" 
                                  data-effect-name="${spec.name}" 
                                  data-effect-description="${tooltipContent}">?</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }));
    
    html += specCards.join('');
    html += '</div>';
    container.innerHTML = html;
    
    // Check if the list is scrollable and add visual indicator (only on smaller screens)
    setTimeout(() => {
        const specializationsList = container.querySelector('.specializations-list');
        if (window.innerWidth <= 1200 && specializationsList && specializationsList.scrollHeight > specializationsList.clientHeight) {
            container.classList.add('has-scroll');
        } else {
            container.classList.remove('has-scroll');
        }
    }, 100);
    
    // Re-setup event listeners for the new cards
    setupSpecializationEventListeners();
    
    // Re-setup highlighting event listeners for new elements
    setupHighlightingEventListeners();
}

/**
 * Create the group UI structure (8 groups with 5 slots each)
 * This function creates the HTML structure for the group management section
 */
function createGroupsUI() {
    const container = document.getElementById('groups-container');
    if (!container) {
        console.error('Groups container not found');
        return;
    }
    
    container.innerHTML = '';
    
    // Create 8 groups with 5 slots each
    for (let groupId = 1; groupId <= 8; groupId++) {
        const group = document.createElement('div');
        group.className = 'group';
        group.dataset.groupId = groupId;
        
        // Create group title
        const groupTitle = document.createElement('div');
        groupTitle.className = 'group-title';
        groupTitle.textContent = `Group ${groupId}`;
        group.appendChild(groupTitle);
        
        // Create slots container
        const slots = document.createElement('div');
        slots.className = 'group-slots';
        
        // Create 5 slots for this group
        for (let slotId = 1; slotId <= 5; slotId++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.groupId = groupId;
            slot.dataset.slotId = slotId;
            
            // Add drop event listeners for drag and drop functionality
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('drop', handleDrop);
            slot.addEventListener('dragenter', handleDragEnter);
            slot.addEventListener('dragleave', handleDragLeave);
            
            slots.appendChild(slot);
        }
        
        group.appendChild(slots);
        
        // Create group effects section (now under the slots)
        const groupEffects = document.createElement('div');
        groupEffects.className = 'group-effects';
        groupEffects.innerHTML = '<span class="group-effects-label">Group Effects:</span> <span class="group-effects-content"></span>';
        group.appendChild(groupEffects);
        
        container.appendChild(group);
    }
    
    console.log('Group UI structure created successfully');
}

/**
 * Setup event listeners for drag and drop functionality
 */
function setupEventListeners() {
    // Event listeners are now set up in createGroupsUI() function
    // This function is kept for compatibility and future enhancements
    console.log('Event listeners setup complete');
    
    // Setup tooltip functionality
    setupTooltipEventListeners();
    setupHighlightingEventListeners(); // Setup highlighting event listeners
}

/**
 * Setup event listeners for specialization cards
 */
function setupSpecializationEventListeners() {
    const specCards = document.querySelectorAll('.specialization-card');
    specCards.forEach(card => {
        card.draggable = true;
        card.addEventListener('dragstart', handleDragStart);
        
        // Add click handler for additional info
        card.addEventListener('click', (event) => {
            if (!event.target.closest('.effect-info-icon')) {
                showSpecializationDetails(card.dataset.specName);
            }
        });
    });
}

/**
 * Setup tooltip event listeners for effect icons
 */
function setupTooltipEventListeners() {
    // Create a single tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'effect-icon-tooltip';
    tooltip.innerHTML = '<div class="tooltip-name"></div><div class="tooltip-description"></div>';
    document.body.appendChild(tooltip);
    
    // Add event listeners to all effect icons and raid effect info icons
    document.addEventListener('mouseover', (event) => {
        if (event.target.classList.contains('effect-icon')) {
            const name = event.target.dataset.effectName;
            const description = event.target.dataset.effectDescription;
            
            // Reset the tooltip name display to block and set content
            tooltip.querySelector('.tooltip-name').style.display = 'block';
            tooltip.querySelector('.tooltip-name').textContent = name;
            tooltip.querySelector('.tooltip-description').textContent = description;
            
            // Position tooltip near cursor
            const rect = event.target.getBoundingClientRect();
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.top = (rect.bottom + 8) + 'px';
            
            // Center the tooltip
            tooltip.style.transform = 'translateX(-50%)';
            
            tooltip.classList.add('show');
        } else if (event.target.classList.contains('effect-info-icon')) {
            const specName = event.target.dataset.effectName;
            const description = event.target.dataset.effectDescription;
            const sources = event.target.dataset.effectSources;
            const status = event.target.dataset.effectStatus;
            
            // Check if this is a specialization card tooltip (has sources/status data) or a raid effect tooltip
            if (sources !== undefined || status !== undefined) {
                // This is a raid effect tooltip - show single effect info
                tooltip.querySelector('.tooltip-name').textContent = specName;
                tooltip.querySelector('.tooltip-name').style.display = 'block';
                tooltip.querySelector('.tooltip-description').textContent = description;
            } else {
                // This is a specialization card tooltip - show full specialization effects
                const spec = specializations.find(s => s.name === specName);
                
                if (spec) {
                    // Hide the name section
                    tooltip.querySelector('.tooltip-name').style.display = 'none';
                    
                    // Build tooltip content with proper HTML structure
                    const raidEffects = spec.effects.filter(effect => effect.scope === 'raid');
                    const groupEffects = spec.effects.filter(effect => effect.scope === 'group');
                    
                    let tooltipHTML = '';
                    
                    if (groupEffects.length > 0) {
                        tooltipHTML += '<div class="tooltip-section-header">Group Effects</div>';
                        groupEffects.forEach(effect => {
                            tooltipHTML += `<div class="tooltip-effect-item">${effect.name} - ${effect.description}</div>`;
                        });
                    }
                    
                    if (raidEffects.length > 0) {
                        if (groupEffects.length > 0) {
                            tooltipHTML += '<div class="tooltip-section-spacer"></div>';
                        }
                        tooltipHTML += '<div class="tooltip-section-header">Raid Effects</div>';
                        raidEffects.forEach(effect => {
                            tooltipHTML += `<div class="tooltip-effect-item">${effect.name} - ${effect.description}</div>`;
                        });
                    }
                    
                    if (!tooltipHTML) {
                        tooltipHTML = '<div class="tooltip-effect-item">No effects</div>';
                    }
                    
                    tooltip.querySelector('.tooltip-description').innerHTML = tooltipHTML;
                }
            }
            
            // Position tooltip near cursor
            const rect = event.target.getBoundingClientRect();
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.top = (rect.bottom + 8) + 'px';
            
            // Center the tooltip
            tooltip.style.transform = 'translateX(-50%)';
            
            tooltip.classList.add('show');
        }
    });
    
    document.addEventListener('mouseout', (event) => {
        if (event.target.classList.contains('effect-icon') || event.target.classList.contains('effect-info-icon')) {
            tooltip.classList.remove('show');
        }
    });
}

/**
 * Clear all highlighting from the interface
 */
function clearAllHighlighting() {
    // Remove all highlight classes
    document.querySelectorAll('.highlight-effect, .highlight-spec, .dimmed').forEach(element => {
        element.classList.remove('highlight-effect', 'highlight-spec', 'dimmed');
    });
}

/**
 * Highlight specializations that provide specific effects
 * @param {Array} effectNames - Array of effect names to highlight
 * @param {string} highlightType - Type of highlighting ('spec', 'effect', 'group-effect', 'raid-effect')
 */
function highlightSpecializationsByEffects(effectNames, highlightType = 'spec') {
    if (!Array.isArray(effectNames) || effectNames.length === 0) return;
    
    // Find all specializations that provide these effects
    const matchingSpecs = specializations.filter(spec => 
        spec.effects.some(effect => effectNames.includes(effect.name))
    );
    
    // Highlight specialization cards in the available specializations section
    matchingSpecs.forEach(spec => {
        const specCard = document.querySelector(`.specialization-card[data-spec-name="${spec.name}"]`);
        if (specCard) {
            specCard.classList.add(`highlight-${highlightType}`);
        }
    });
    
    // Highlight assigned specializations in groups
    const assignedSpecs = document.querySelectorAll('.specialization-assigned');
    assignedSpecs.forEach(specElement => {
        try {
            const specData = JSON.parse(specElement.dataset.spec);
            if (specData.effects.some(effect => effectNames.includes(effect.name))) {
                // Apply highlighting to the wrapper instead of the element with background image
                const wrapper = specElement.closest('.spec-wrapper') || specElement;
                wrapper.classList.add(`highlight-${highlightType}`);
            }
        } catch (error) {
            console.warn('Error parsing specialization data for highlighting:', error);
        }
    });
}

/**
 * Highlight effects that are provided by a specific specialization
 * @param {string} specName - Name of the specialization
 * @param {string} highlightType - Type of highlighting ('effect', 'group-effect', 'raid-effect')
 */
function highlightEffectsBySpecialization(specName, highlightType = 'effect') {
    const spec = specializations.find(s => s.name === specName);
    if (!spec) return;
    
    // Get all effect names from this specialization
    const effectNames = spec.effects.map(effect => effect.name);
    
    // Highlight group effects
    const groupEffectIcons = document.querySelectorAll('.group-effects-content .effect-icon');
    groupEffectIcons.forEach(icon => {
        const effectName = icon.dataset.effectName;
        if (effectNames.includes(effectName)) {
            // Apply highlighting to the wrapper instead of the element with background image
            const wrapper = icon.closest('.effect-icon-wrapper') || icon;
            wrapper.classList.add(`highlight-${highlightType}`);
        }
    });
    
    // Highlight raid effects
    const raidEffectItems = document.querySelectorAll('.effect-item');
    raidEffectItems.forEach(item => {
        const effectName = item.querySelector('strong')?.textContent;
        if (effectName && effectNames.includes(effectName)) {
            item.classList.add(`highlight-${highlightType}`);
        }
    });
}

/**
 * Highlight group effects and their providers within a specific group
 * @param {string} effectName - Name of the effect to highlight
 * @param {number} groupId - ID of the group to focus on
 */
function highlightGroupEffectAndProviders(effectName, groupId) {
    // Don't highlight the group effect icon itself - just highlight the providers
    
    // Highlight specializations in this group that provide this effect
    const group = document.querySelector(`[data-group-id="${groupId}"]`);
    const slots = group?.querySelectorAll('.slot');
    if (slots) {
        slots.forEach(slot => {
            const specElement = slot.querySelector('.specialization-assigned');
            if (specElement) {
                try {
                    const specData = JSON.parse(specElement.dataset.spec);
                    if (specData.effects.some(effect => effect.name === effectName)) {
                        // Apply highlighting to the wrapper instead of the element with background image
                        const wrapper = specElement.closest('.spec-wrapper') || specElement;
                        wrapper.classList.add('highlight-spec');
                    }
                } catch (error) {
                    console.warn('Error parsing specialization data for group highlighting:', error);
                }
            }
        });
    }
    
    // Highlight specialization cards in available specializations
    const matchingSpecs = specializations.filter(spec => 
        spec.effects.some(effect => effect.name === effectName)
    );
    
    matchingSpecs.forEach(spec => {
        const specCard = document.querySelector(`.specialization-card[data-spec-name="${spec.name}"]`);
        if (specCard) {
            specCard.classList.add('highlight-spec');
        }
    });
}

/**
 * Highlight raid effects and all their providers
 * @param {string} effectName - Name of the raid effect to highlight
 */
function highlightRaidEffectAndProviders(effectName) {
    // Don't highlight the raid effect item itself - just highlight the providers
    
    // Highlight all specializations that provide this effect
    const matchingSpecs = specializations.filter(spec => 
        spec.effects.some(effect => effect.name === effectName)
    );
    
    // Highlight specialization cards
    matchingSpecs.forEach(spec => {
        const specCard = document.querySelector(`.specialization-card[data-spec-name="${spec.name}"]`);
        if (specCard) {
            specCard.classList.add('highlight-spec');
        }
    });
    
    // Highlight assigned specializations in all groups
    const assignedSpecs = document.querySelectorAll('.specialization-assigned');
    assignedSpecs.forEach(specElement => {
        try {
            const specData = JSON.parse(specElement.dataset.spec);
            if (specData.effects.some(effect => effect.name === effectName)) {
                // Apply highlighting to the wrapper instead of the element with background image
                const wrapper = specElement.closest('.spec-wrapper') || specElement;
                wrapper.classList.add('highlight-spec');
            }
        } catch (error) {
            console.warn('Error parsing specialization data for raid highlighting:', error);
        }
    });
}

/**
 * Setup highlighting event listeners (only called once)
 */
function setupHighlightingEventListeners() {
    // Remove any existing highlighting event listeners to prevent duplicates
    document.removeEventListener('mouseover', handleHighlightingMouseOver);
    document.removeEventListener('mouseout', handleHighlightingMouseOut);
    
    // Add the event listeners
    document.addEventListener('mouseover', handleHighlightingMouseOver);
    document.addEventListener('mouseout', handleHighlightingMouseOut);
}

/**
 * Handle mouseover events for highlighting
 */
function handleHighlightingMouseOver(event) {
    const specCard = event.target.closest('.specialization-card');
    if (specCard) {
        const specName = specCard.dataset.specName;
        if (specName) {
            clearAllHighlighting();
            highlightEffectsBySpecialization(specName, 'effect');
        }
        return;
    }
    
    // Assigned specialization hover events
    const assignedSpec = event.target.closest('.specialization-assigned');
    if (assignedSpec) {
        try {
            const specData = JSON.parse(assignedSpec.dataset.spec);
            clearAllHighlighting();
            highlightEffectsBySpecialization(specData.name, 'effect');
        } catch (error) {
            console.warn('Error parsing specialization data for highlighting:', error);
        }
        return;
    }
    
    // Group effect hover events
    const groupEffectIcon = event.target.closest('.effect-icon');
    if (groupEffectIcon && groupEffectIcon.closest('.group-effects-content')) {
        const effectName = groupEffectIcon.dataset.effectName;
        const groupId = parseInt(groupEffectIcon.closest('.group').dataset.groupId);
        if (effectName && groupId) {
            clearAllHighlighting();
            highlightGroupEffectAndProviders(effectName, groupId);
        }
        return;
    }
    
    // Raid effect hover events
    const raidEffectItem = event.target.closest('.effect-item');
    if (raidEffectItem) {
        const effectName = raidEffectItem.querySelector('strong')?.textContent;
        if (effectName) {
            clearAllHighlighting();
            highlightRaidEffectAndProviders(effectName);
        }
        return;
    }
}

/**
 * Handle mouseout events for highlighting
 */
function handleHighlightingMouseOut(event) {
    const specCard = event.target.closest('.specialization-card');
    const assignedSpec = event.target.closest('.specialization-assigned');
    const groupEffectIcon = event.target.closest('.effect-icon');
    const raidEffectItem = event.target.closest('.effect-item');
    
    if (!specCard && !assignedSpec && !groupEffectIcon && !raidEffectItem) {
        // Check if we're still hovering over any of these elements
        const hoveredElement = document.querySelector(':hover');
        if (!hoveredElement || 
            (!hoveredElement.closest('.specialization-card') && 
             !hoveredElement.closest('.specialization-assigned') && 
             !hoveredElement.closest('.effect-icon') && 
             !hoveredElement.closest('.effect-item'))) {
            clearAllHighlighting();
        }
    }
}

/**
 * Handle drag start event for specialization cards
 */
function handleDragStart(event) {
    const specName = event.target.dataset.specName;
    event.dataTransfer.setData('text/plain', specName);
    event.dataTransfer.setData('type', 'new-spec');
    event.dataTransfer.effectAllowed = 'copy';
}

/**
 * Handle drag start event for assigned specializations
 */
function handleAssignedDragStart(event) {
    const specData = event.target.dataset.spec;
    event.dataTransfer.setData('application/json', specData);
    event.dataTransfer.setData('type', 'assigned-spec');
    event.dataTransfer.effectAllowed = 'move';
    
    // Store reference to the original element to remove it after successful drop
    event.dataTransfer.setData('original-element', 'true');
}

/**
 * Handle drag end event for assigned specializations
 */
function handleAssignedDragEnd(event) {
    // If the drop was successful, remove the original element
    if (event.dataTransfer.dropEffect === 'move') {
        event.target.remove();
    }
}

/**
 * Handle drag over event for group slots
 */
function handleDragOver(e) {
    e.preventDefault();
    
    // Check if this is an assigned specialization being dragged
    const dragType = e.dataTransfer.types.includes('application/json') ? 'move' : 'copy';
    e.dataTransfer.dropEffect = dragType;
}

/**
 * Handle drag enter event for group slots
 */
function handleDragEnter(e) {
    // Find the slot (either the target is a slot or we need to find the parent slot)
    let slot = e.target;
    if (!slot.classList.contains('slot')) {
        slot = slot.closest('.slot');
    }
    
    if (slot && slot.classList.contains('slot')) {
        slot.classList.add('drag-over');
    }
}

/**
 * Handle drag leave event for group slots
 */
function handleDragLeave(e) {
    // Find the slot (either the target is a slot or we need to find the parent slot)
    let slot = e.target;
    if (!slot.classList.contains('slot')) {
        slot = slot.closest('.slot');
    }
    
    if (slot && slot.classList.contains('slot')) {
        slot.classList.remove('drag-over');
    }
}

/**
 * Handle drop event for group slots
 */
async function handleDrop(e) {
    e.preventDefault();
    
    // Find the slot (either the target is a slot or we need to find the parent slot)
    let slot = e.target;
    if (!slot.classList.contains('slot')) {
        slot = slot.closest('.slot');
    }
    
    // Allow drops on any slot (empty or occupied)
    if (slot && slot.classList.contains('slot')) {
        slot.classList.remove('drag-over');
        const dropType = e.dataTransfer.getData('type');
        
        if (dropType === 'new-spec') {
            // Handle dropping a new specialization from the available list
            const specName = e.dataTransfer.getData('text/plain');
            if (specName) {
                await assignSpecializationToSlot(specName, slot);
            }
        } else if (dropType === 'assigned-spec') {
            // Handle moving an already assigned specialization
            const specData = e.dataTransfer.getData('application/json');
            if (specData) {
                await moveAssignedSpecialization(specData, slot);
                // Remove the original element (it will be recreated in the new slot)
                // The original element will be automatically removed when the new one is created
            }
        }
    }
}

/**
 * Handle slot click event
 */
async function handleSlotClick(event) {
    const slot = event.target.closest('.slot');
    if (slot) {
        // Clear the slot by removing all child elements
        slot.innerHTML = '';
        updateRaidEffects();
        await refreshGroupEffects();
        
        // Mark as dirty since composition was modified
        isDirty = true;
        
        // Update status to show unsaved changes
        updateCompositionStatus();
    }
}

/**
 * Check if an icon file exists and return fallback if not
 * @param {string} iconPath - The icon path to check
 * @returns {string} - The original path if valid, or fallback path
 */
async function getValidIconPath(iconPath) {
    try {
        const response = await fetch(iconPath, { method: 'HEAD' });
        if (response.ok) {
            return iconPath;
        }
    } catch (error) {
        console.warn(`Icon not found: ${iconPath}, using fallback`);
    }
    return 'raidicons/invalid.png';
}

/**
 * Assign a specialization to a player slot
 */
async function assignSpecializationToSlot(specName, slot) {
    const spec = specializations.find(s => s.name === specName);
    if (!spec) return;

    const groupId = parseInt(slot.dataset.groupId);
    const slotId = parseInt(slot.dataset.slotId);
    
    // Clear the slot first (in case it already has a specialization)
    slot.innerHTML = '';
    
    // Get valid icon path with fallback
    const validIconPath = await getValidIconPath(spec.icon_path);
    
    // Create a wrapper for highlighting
    const specWrapper = document.createElement('div');
    specWrapper.className = 'spec-wrapper';
    
    // Create a visual representation of the specialization in the slot
    const specElement = document.createElement('div');
    specElement.className = 'specialization-assigned';
    specElement.style.backgroundImage = `url(${validIconPath})`;
    specElement.dataset.spec = JSON.stringify(spec);
    specElement.draggable = true;
    
    // Add drag event listeners for the assigned specialization
    specElement.addEventListener('dragstart', handleAssignedDragStart);
    specElement.addEventListener('dragend', handleAssignedDragEnd);
    
    // Also add drag event listeners to the specialization element itself for drop handling
    specElement.addEventListener('dragover', handleDragOver);
    specElement.addEventListener('dragenter', handleDragEnter);
    specElement.addEventListener('dragleave', handleDragLeave);
    specElement.addEventListener('drop', handleDrop);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-spec';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', async function() {
        slot.innerHTML = '';
        updateRaidEffects();
        await refreshGroupEffects();
        
        // Mark as dirty since composition was modified
        isDirty = true;
        
        // Update status to show unsaved changes
        updateCompositionStatus();
    });
    
    specElement.appendChild(removeBtn);
    specWrapper.appendChild(specElement);
    slot.appendChild(specWrapper);
    
    // Update effects
    updateRaidEffects();
    refreshGroupEffects();
    
    // Re-setup highlighting event listeners for new elements
    setupHighlightingEventListeners();
    
    // Mark as dirty since composition was modified
    isDirty = true;
    
    // Update status to show unsaved changes
    updateCompositionStatus();
}



/**
 * Move an assigned specialization to a new slot
 */
async function moveAssignedSpecialization(specData, targetSlot) {
    const spec = JSON.parse(specData);
    
    // Clear the target slot first (in case it already has a specialization)
    targetSlot.innerHTML = '';
    
    // Get valid icon path with fallback
    const validIconPath = await getValidIconPath(spec.icon_path);
    
    // Create a wrapper for highlighting
    const specWrapper = document.createElement('div');
    specWrapper.className = 'spec-wrapper';
    
    // Create a visual representation of the specialization in the new slot
    const specElement = document.createElement('div');
    specElement.className = 'specialization-assigned';
    specElement.style.backgroundImage = `url(${validIconPath})`;
    specElement.dataset.spec = specData;
    specElement.draggable = true;
    
    // Add drag event listeners for the assigned specialization
    specElement.addEventListener('dragstart', handleAssignedDragStart);
    specElement.addEventListener('dragend', handleAssignedDragEnd);
    
    // Also add drag event listeners to the specialization element itself for drop handling
    specElement.addEventListener('dragover', handleDragOver);
    specElement.addEventListener('dragenter', handleDragEnter);
    specElement.addEventListener('dragleave', handleDragLeave);
    specElement.addEventListener('drop', handleDrop);
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-spec';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', async function() {
        targetSlot.innerHTML = '';
        updateRaidEffects();
        await refreshGroupEffects();
        
        // Mark as dirty since composition was modified
        isDirty = true;
        
        // Update status to show unsaved changes
        updateCompositionStatus();
    });
    
    specElement.appendChild(removeBtn);
    specWrapper.appendChild(specElement);
    targetSlot.appendChild(specWrapper);
    
    // Update effects
    updateRaidEffects();
    refreshGroupEffects();
    
    // Re-setup highlighting event listeners for new elements
    setupHighlightingEventListeners();
    
    // Mark as dirty since composition was modified
    isDirty = true;
    
    // Update status to show unsaved changes
    updateCompositionStatus();
}

/**
 * Refresh group-specific effects display with deduplication
 */
async function refreshGroupEffects() {
    // Get all slots with assigned specializations
    const slots = document.querySelectorAll('.slot');
    const groupEffects = {};
    
    // Initialize group effects for all 8 groups
    for (let i = 1; i <= 8; i++) {
        groupEffects[i] = new Map(); // Use Map to track effect counts
    }
    
    // Collect effects from assigned specializations with counts
    slots.forEach(slot => {
        const specElement = slot.querySelector('.specialization-assigned');
        if (specElement) {
            const specData = JSON.parse(specElement.dataset.spec);
            const groupId = parseInt(slot.dataset.groupId);
            
            specData.effects.forEach(effect => {
                if (effect.scope === 'group') {
                    // Create a unique key for the effect (name + type)
                    const effectKey = `${effect.name}-${effect.type}`;
                    
                    if (groupEffects[groupId].has(effectKey)) {
                        // Increment count for existing effect
                        const existing = groupEffects[groupId].get(effectKey);
                        existing.count++;
                    } else {
                        // Add new effect with count 1
                        groupEffects[groupId].set(effectKey, {
                            ...effect,
                            count: 1
                        });
                    }
                }
            });
        }
    });
    
    // Update group effects display
    for (let groupId = 1; groupId <= 8; groupId++) {
        const group = document.querySelector(`[data-group-id="${groupId}"]`);
        if (group) {
            const effectsContent = group.querySelector('.group-effects-content');
            if (effectsContent) {
                const uniqueEffects = Array.from(groupEffects[groupId].values());
                
                if (uniqueEffects.length > 0) {
                    // Create effect icons with fallback validation
                    const effectIcons = await Promise.all(uniqueEffects.map(async (effect) => {
                        const validIconPath = await getValidIconPath(effect.icon_path);
                        const countDisplay = effect.count > 1 ? ` (${effect.count})` : '';
                        return `<div class="effect-icon-wrapper">
                                    <div class="effect-icon effect-${effect.type}" 
                                         style="background-image: url(${validIconPath}); background-size: contain; background-position: center; background-repeat: no-repeat;"
                                         data-effect-name="${effect.name}"
                                         data-effect-description="${effect.description}${countDisplay}"></div>
                                </div>`;
                    }));
                    effectsContent.innerHTML = effectIcons.join('');
                } else {
                    effectsContent.innerHTML = 'No group effects';
                }
            }
        }
    }
    
    // Re-setup highlighting event listeners for new group effect icons
    setupHighlightingEventListeners();
}

/**
 * Update raid effects display
 */
function updateRaidEffects() {
    // First, collect all possible raid effects from loaded specializations
    const allPossibleRaidEffects = {};
    
    specializations.forEach(spec => {
        spec.effects.forEach(effect => {
            if (effect.scope === 'raid') {
                if (!allPossibleRaidEffects[effect.name]) {
                    allPossibleRaidEffects[effect.name] = {
                        name: effect.name,
                        type: effect.type,
                        description: effect.description,
                        count: 0,
                        sources: [],
                        availableFrom: []
                    };
                }
                // Track which specializations can provide this effect
                if (!allPossibleRaidEffects[effect.name].availableFrom.includes(spec.name)) {
                    allPossibleRaidEffects[effect.name].availableFrom.push(spec.name);
                }
            }
        });
    });
    
    // Get all slots with assigned specializations
    const slots = document.querySelectorAll('.slot');
    
    // Update counts and sources based on currently assigned specializations
    slots.forEach(slot => {
        const specElement = slot.querySelector('.specialization-assigned');
        if (specElement) {
            const specData = JSON.parse(specElement.dataset.spec);
            specData.effects.forEach(effect => {
                // ONLY process raid-wide effects, exclude group effects
                if (effect.scope === 'raid' && allPossibleRaidEffects[effect.name]) {
                    allPossibleRaidEffects[effect.name].count++;
                    if (!allPossibleRaidEffects[effect.name].sources.includes(specData.name)) {
                        allPossibleRaidEffects[effect.name].sources.push(specData.name);
                    }
                }
            });
        }
    });
    
    // Organize effects by type (buff, debuff, other)
    const effectsByType = {
        'buff': [],
        'debuff': [],
        'other': []
    };
    
    Object.values(allPossibleRaidEffects).forEach(effect => {
        effectsByType[effect.type].push(effect);
    });
    
    // Update the effects display
    const container = document.getElementById('effects-container');
    if (container) {
        const totalEffects = Object.values(allPossibleRaidEffects).length;
        const activeEffects = Object.values(allPossibleRaidEffects).filter(effect => effect.count > 0).length;
        
        container.innerHTML = `
            <div class="effects-summary">
                <h3>Raid Effects Summary</h3>
                <div class="effects-stats">
                    <p><strong>Active Effects:</strong> ${activeEffects} / ${totalEffects}</p>
                </div>
            </div>
            <div class="effects-details">
                ${[
                    { key: 'buff', title: 'Buffs' },
                    { key: 'debuff', title: 'Debuffs' },
                    { key: 'other', title: 'Util' }
                ].map(({ key, title }) => {
                    const typeEffects = effectsByType[key];
                    if (typeEffects.length === 0) {
                        return `
                            <div class="effects-by-type">
                                <h4>${title}</h4>
                                <div class="no-effects">No raid-wide ${key}s available</div>
                            </div>
                        `;
                    } else {
                        const sortedEffects = typeEffects.sort((a, b) => a.name.localeCompare(b.name));
                        const leftColumn = sortedEffects.slice(0, Math.ceil(sortedEffects.length / 2));
                        const rightColumn = sortedEffects.slice(Math.ceil(sortedEffects.length / 2));
                        
                        return `
                            <div class="effects-by-type">
                                <h4>${title}</h4>
                                <div class="effects-two-column">
                                    <div class="effects-column">
                                        ${leftColumn.map(effect => `
                                            <div class="effect-item ${effect.count > 0 ? 'effect-active' : 'effect-inactive'}">
                                                <div class="effect-header">
                                                    <strong>${effect.name}</strong>
                                                    <span class="effect-count ${effect.count > 0 ? 'active' : 'inactive'}">${effect.count}</span>
                                                    <span class="effect-info-icon" 
                                                          data-effect-name="${effect.name}" 
                                                          data-effect-description="${effect.description}"
                                                          data-effect-sources="${effect.count > 0 ? effect.sources.join(', ') : effect.availableFrom.join(', ')}"
                                                          data-effect-status="${effect.count > 0 ? 'active' : 'available'}">?</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="effects-column">
                                        ${rightColumn.map(effect => `
                                            <div class="effect-item ${effect.count > 0 ? 'effect-active' : 'effect-inactive'}">
                                                <div class="effect-header">
                                                    <strong>${effect.name}</strong>
                                                    <span class="effect-count ${effect.count > 0 ? 'active' : 'inactive'}">${effect.count}</span>
                                                    <span class="effect-info-icon" 
                                                          data-effect-name="${effect.name}" 
                                                          data-effect-description="${effect.description}"
                                                          data-effect-sources="${effect.count > 0 ? effect.sources.join(', ') : effect.availableFrom.join(', ')}"
                                                          data-effect-status="${effect.count > 0 ? 'active' : 'available'}">?</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
        
        // Re-setup highlighting event listeners for new raid effect items
        setupHighlightingEventListeners();
    }
}

/**
 * Save composition state to localStorage
 */
function saveComposition() {
    try {
        // Collect data from all raid slots
        const compositionData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            groups: {}
        };
        
        // Iterate through all groups (1-8)
        for (let groupId = 1; groupId <= 8; groupId++) {
            compositionData.groups[groupId] = {};
            
            // Iterate through all slots in this group (1-5)
            for (let slotId = 1; slotId <= 5; slotId++) {
                const slot = document.querySelector(`[data-group-id="${groupId}"][data-slot-id="${slotId}"]`);
                if (slot) {
                    const specElement = slot.querySelector('.specialization-assigned');
                    if (specElement) {
                        // Extract specialization data from the slot
                        const specData = JSON.parse(specElement.dataset.spec);
                        // Only save the specialization name - we'll reconstruct the rest on load
                        compositionData.groups[groupId][slotId] = specData.name;
                    } else {
                        // Empty slot
                        compositionData.groups[groupId][slotId] = null;
                    }
                }
            }
        }
        
        // Convert to JSON and save to localStorage
        const jsonData = JSON.stringify(compositionData);
        localStorage.setItem('raidComposition', jsonData);
        
        // Mark as not dirty since we just saved
        isDirty = false;
        
        console.log('Composition saved successfully:', compositionData);
        return true;
        
    } catch (error) {
        console.error('Failed to save composition:', error);
        return false;
    }
}

/**
 * Load composition state from localStorage
 */
function loadComposition() {
    try {
        // Retrieve saved data from localStorage
        const savedData = localStorage.getItem('raidComposition');
        
        if (!savedData) {
            console.log('No saved composition found');
            return false;
        }
        
        // Parse the JSON data
        const compositionData = JSON.parse(savedData);
        
        // Validate the data structure
        if (!compositionData || !compositionData.groups || typeof compositionData.groups !== 'object') {
            throw new Error('Invalid composition data structure');
        }
        
        // Clear all existing slots first
        const allSlots = document.querySelectorAll('.slot');
        allSlots.forEach(slot => {
            slot.innerHTML = '';
        });
        
        // Restore specializations to their slots
        for (const groupId in compositionData.groups) {
            const group = compositionData.groups[groupId];
            
            for (const slotId in group) {
                const specName = group[slotId];
                
                if (specName && typeof specName === 'string') {
                    // Find the specialization data from loaded specializations
                    const specData = specializations.find(spec => spec.name === specName);
                    
                    if (specData) {
                        // Find the slot element
                        const slot = document.querySelector(`[data-group-id="${groupId}"][data-slot-id="${slotId}"]`);
                        
                        if (slot) {
                            // Get valid icon path with fallback
                            getValidIconPath(specData.icon_path).then(validIconPath => {
                                // Create a wrapper for highlighting
                                const specWrapper = document.createElement('div');
                                specWrapper.className = 'spec-wrapper';
                                
                                // Create the specialization element
                                const specElement = document.createElement('div');
                                specElement.className = 'specialization-assigned';
                                specElement.style.backgroundImage = `url(${validIconPath})`;
                                specElement.dataset.spec = JSON.stringify(specData);
                                specElement.draggable = true;
                                
                                // Add drag event listeners
                                specElement.addEventListener('dragstart', handleAssignedDragStart);
                                specElement.addEventListener('dragend', handleAssignedDragEnd);
                                specElement.addEventListener('dragover', handleDragOver);
                                specElement.addEventListener('dragenter', handleDragEnter);
                                specElement.addEventListener('dragleave', handleDragLeave);
                                specElement.addEventListener('drop', handleDrop);
                                
                                // Add remove button
                                const removeBtn = document.createElement('button');
                                removeBtn.className = 'remove-spec';
                                removeBtn.innerHTML = '&times;';
                                removeBtn.addEventListener('click', async function() {
                                    slot.innerHTML = '';
                                    updateRaidEffects();
                                    await refreshGroupEffects();
                                    
                                    // Mark as dirty since composition was modified
                                    isDirty = true;
                                    
                                    // Update status to show unsaved changes
                                    updateCompositionStatus();
                                });
                                
                                specElement.appendChild(removeBtn);
                                specWrapper.appendChild(specElement);
                                slot.appendChild(specWrapper);
                            });
                        }
                    } else {
                        console.warn(`Specialization "${specName}" not found in loaded data - slot will remain empty`);
                    }
                }
            }
        }
        
        // Update effects after loading (with a small delay to ensure all async operations complete)
        setTimeout(() => {
            updateRaidEffects();
            refreshGroupEffects();
            // Re-setup highlighting event listeners for loaded elements
            setupHighlightingEventListeners();
        }, 100);
        
        // Mark as not dirty since we just loaded
        isDirty = false;
        
        console.log('Composition loaded successfully:', compositionData);
        return true;
        
    } catch (error) {
        console.error('Failed to load composition:', error);
        
        // Clear corrupted data
        localStorage.removeItem('raidComposition');
        
        // Show error to user
        showError(`Failed to load saved composition: ${error.message}. The saved data has been cleared.`);
        
        return false;
    }
}

/**
 * Clear saved composition data
 */
function clearSavedComposition() {
    try {
        localStorage.removeItem('raidComposition');
        console.log('Saved composition cleared');
        return true;
    } catch (error) {
        console.error('Failed to clear saved composition:', error);
        return false;
    }
}

/**
 * Check if there is a saved composition available
 */
function hasSavedComposition() {
    try {
        const savedData = localStorage.getItem('raidComposition');
        if (!savedData) return false;
        
        const compositionData = JSON.parse(savedData);
        return compositionData && compositionData.groups;
        
    } catch (error) {
        console.error('Error checking for saved composition:', error);
        return false;
    }
}

/**
 * Setup header controls
 */
function setupHeaderControls() {
    // Add event listeners for header buttons
    const saveBtn = document.getElementById('save-composition-btn');
    const loadBtn = document.getElementById('load-composition-btn');
    const clearBtn = document.getElementById('clear-composition-btn');
    const clearSavedBtn = document.getElementById('clear-saved-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveComposition);
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadComposition);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearComposition);
    }
    
    if (clearSavedBtn) {
        clearSavedBtn.addEventListener('click', handleClearSavedComposition);
    }
    
    // Update button states and status display
    updateCompositionButtons();
    updateCompositionStatus();
}

/**
 * Handle save composition button click
 */
function handleSaveComposition() {
    const success = saveComposition();
    if (success) {
        showSuccess('Composition saved successfully');
        updateCompositionStatus();
        updateCompositionButtons();
    } else {
        showError('Failed to save composition');
    }
}

/**
 * Handle load composition button click
 */
function handleLoadComposition() {
    const success = loadComposition();
    if (success) {
        showSuccess('Composition loaded successfully');
        updateCompositionStatus();
    } else {
        showError('Failed to load composition');
    }
}

/**
 * Handle clear composition button click
 */
function handleClearComposition() {
    // Only show confirmation if the composition is dirty (has unsaved changes)
    if (isDirty) {
        if (!confirm('Are you sure you want to clear all slots? This action cannot be undone.')) {
            return;
        }
    }
    
    // Clear all slots
    const allSlots = document.querySelectorAll('.slot');
    allSlots.forEach(slot => {
        slot.innerHTML = '';
    });
    
    // Update effects
    updateRaidEffects();
    refreshGroupEffects();
    
    // Mark as not dirty since we just cleared
    isDirty = false;
    
    // Update status displays
    updateCompositionStatus();
    
    showSuccess('All slots cleared');
}

/**
 * Handle clear saved composition button click
 */
function handleClearSavedComposition() {
    if (confirm('Are you sure you want to delete the saved composition? This action cannot be undone.')) {
        const success = clearSavedComposition();
        if (success) {
            showSuccess('Saved composition deleted');
            updateCompositionStatus();
            updateCompositionButtons();
        } else {
            showError('Failed to delete saved composition');
        }
    }
}

/**
 * Update composition status display
 */
function updateCompositionStatus() {
    const headerStatusElement = document.getElementById('header-status');
    
    if (headerStatusElement) {
        if (hasSavedComposition()) {
            try {
                const savedData = localStorage.getItem('raidComposition');
                const compositionData = JSON.parse(savedData);
                const timestamp = new Date(compositionData.timestamp);
                
                // Count how many specializations are in the saved composition
                let specCount = 0;
                for (const groupId in compositionData.groups) {
                    const group = compositionData.groups[groupId];
                    for (const slotId in group) {
                        if (group[slotId] && typeof group[slotId] === 'string') {
                            specCount++;
                        }
                    }
                }
                
                // Show dirty indicator if there are unsaved changes
                const dirtyIndicator = isDirty ? ' (unsaved changes)' : '';
                headerStatusElement.textContent = `Saved: ${timestamp.toLocaleString()} (${specCount} specs)${dirtyIndicator}`;
            } catch (error) {
                const dirtyIndicator = isDirty ? ' (unsaved changes)' : '';
                headerStatusElement.textContent = `Saved composition available (timestamp unavailable)${dirtyIndicator}`;
            }
        } else {
            const dirtyIndicator = isDirty ? ' (unsaved changes)' : '';
            headerStatusElement.textContent = `No composition saved${dirtyIndicator}`;
        }
    }
}

/**
 * Update composition button states
 */
function updateCompositionButtons() {
    const loadBtn = document.getElementById('load-composition-btn');
    const clearSavedBtn = document.getElementById('clear-saved-btn');
    
    if (loadBtn) {
        loadBtn.disabled = !hasSavedComposition();
    }
    
    if (clearSavedBtn) {
        clearSavedBtn.disabled = !hasSavedComposition();
    }
}

/**
 * Show specialization details in a modal or tooltip
 */
function showSpecializationDetails(specName) {
    const spec = specializations.find(s => s.name === specName);
    if (!spec) return;
    
    const details = `
        <div class="spec-details">
            <h3>${spec.name}</h3>
            <p><strong>Class:</strong> ${spec.class}</p>
            <p><strong>Total Effects:</strong> ${spec.effects.length}</p>
            <div class="effects-breakdown">
                <h4>Effects Breakdown:</h4>
                ${spec.effects.map(effect => `
                    <div class="effect-detail effect-${effect.type}">
                        <strong>${effect.name}</strong> (${effect.type})
                        <br><small>${effect.description}</small>
                        <br><small>Scope: ${effect.scope}</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Simple alert for now - could be enhanced with a modal
    alert(details.replace(/<[^>]*>/g, ''));
}

/**
 * Show error message to user with retry option
 */
function showError(message) {
    const container = document.getElementById('specializations-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Error Loading Specializations</h3>
                <p>${message}</p>
                <div class="error-actions">
                    <button onclick="reloadSpecializations()" class="retry-btn">🔄 Retry</button>
                    <button onclick="location.reload()" class="reload-btn">🔄 Reload Page</button>
                </div>
                <div class="error-details">
                    <p><small>If the problem persists, check your network connection and try again.</small></p>
                </div>
            </div>
        `;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    const container = document.getElementById('specializations-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-message">
                <h3>🔄 Loading Specializations...</h3>
                <p>Please wait while we load the specialization data.</p>
                <div class="loading-spinner"></div>
            </div>
        `;
    }
}

/**
 * Show success message
 */
function showSuccess(message) {
    console.log(`✅ ${message}`);
    // Could be enhanced with a toast notification
}



// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 