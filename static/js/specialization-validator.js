/**
 * Specialization Validator Module
 * Client-side validation for WoW specialization JSON data
 */

/**
 * Validates specialization JSON data against the defined schema
 * @param {Object} specData - The specialization data to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateSpecializationData(specData) {
    // Check if input is an object
    if (!specData || typeof specData !== 'object' || Array.isArray(specData)) {
        return false;
    }

    // Check required fields
    const requiredFields = ['name', 'class', 'icon_path', 'effects'];
    for (const field of requiredFields) {
        if (!(field in specData)) {
            return false;
        }
    }

    // Validate name field
    if (typeof specData.name !== 'string' || specData.name.trim() === '') {
        return false;
    }
    if (specData.name.length > 100) {
        return false;
    }

    // Validate class field (extensible - any non-empty string)
    if (typeof specData.class !== 'string' || specData.class.trim() === '') {
        return false;
    }
    if (specData.class.length > 50) {
        return false;
    }

    // Validate icon_path field
    if (typeof specData.icon_path !== 'string' || specData.icon_path.trim() === '') {
        return false;
    }
    if (specData.icon_path.length > 200) {
        return false;
    }
    // Check icon path pattern: icons/[subfolder/]filename.(png|jpg|jpeg|svg)
    const iconPathPattern = /^icons\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)$/;
    if (!iconPathPattern.test(specData.icon_path)) {
        return false;
    }

    // Validate effects array
    if (!Array.isArray(specData.effects)) {
        return false;
    }
    if (specData.effects.length > 50) {
        return false;
    }

    // Validate each effect
    for (const effect of specData.effects) {
        if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
            return false;
        }

        const effectFields = ['name', 'type', 'scope', 'description', 'icon_path'];
        for (const field of effectFields) {
            if (!(field in effect)) {
                return false;
            }
        }

        // Validate effect name
        if (typeof effect.name !== 'string' || effect.name.trim() === '') {
            return false;
        }
        if (effect.name.length > 100) {
            return false;
        }

        // Validate effect type
        if (!['buff', 'debuff', 'other'].includes(effect.type)) {
            return false;
        }

        // Validate effect scope
        if (!['raid', 'group'].includes(effect.scope)) {
            return false;
        }

        // Validate effect description
        if (typeof effect.description !== 'string' || effect.description.trim() === '') {
            return false;
        }
        if (effect.description.length > 500) {
            return false;
        }

        // Validate effect icon_path (now more lenient since we have fallbacks)
        if (typeof effect.icon_path !== 'string' || effect.icon_path.trim() === '') {
            return false;
        }
        if (effect.icon_path.length > 200) {
            return false;
        }
        // Check effect icon path pattern: icons/[subfolder/]filename.(png|jpg|jpeg|svg)
        const effectIconPathPattern = /^icons\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)$/;
        if (!effectIconPathPattern.test(effect.icon_path)) {
            console.warn(`Effect "${effect.name}" has invalid icon path: ${effect.icon_path}`);
            // Don't fail validation, just warn - the fallback will handle it
        }

    }

    return true;
}

/**
 * Validates a single effect object
 * @param {Object} effect - The effect object to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEffect(effect) {
    if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
        return false;
    }

    const effectFields = ['name', 'type', 'scope', 'description', 'icon_path'];
    for (const field of effectFields) {
        if (!(field in effect)) {
            return false;
        }
    }

    // Validate effect name
    if (typeof effect.name !== 'string' || effect.name.trim() === '') {
        return false;
    }
    if (effect.name.length > 100) {
        return false;
    }

    // Validate effect type
    if (!['buff', 'debuff', 'other'].includes(effect.type)) {
        return false;
    }

    // Validate effect scope
    if (!['raid', 'group'].includes(effect.scope)) {
        return false;
    }

    // Validate effect description
    if (typeof effect.description !== 'string' || effect.description.trim() === '') {
        return false;
    }
    if (effect.description.length > 500) {
        return false;
    }

    // Validate effect icon_path (now more lenient since we have fallbacks)
    if (typeof effect.icon_path !== 'string' || effect.icon_path.trim() === '') {
        return false;
    }
    if (effect.icon_path.length > 200) {
        return false;
    }
    // Check effect icon path pattern: icons/[subfolder/]filename.(png|jpg|jpeg|svg)
    const effectIconPathPattern = /^icons\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)$/;
    if (!effectIconPathPattern.test(effect.icon_path)) {
        console.warn(`Effect "${effect.name}" has invalid icon path: ${effect.icon_path}`);
        // Don't fail validation, just warn - the fallback will handle it
    }

    return true;
}

/**
 * Gets validation errors for a specialization data object
 * @param {Object} specData - The specialization data to validate
 * @returns {Array} - Array of error messages, empty if valid
 */
function getValidationErrors(specData) {
    const errors = [];

    // Check if input is an object
    if (!specData || typeof specData !== 'object' || Array.isArray(specData)) {
        errors.push('Specialization data must be an object');
        return errors;
    }

    // Check required fields
    const requiredFields = ['name', 'class', 'icon_path', 'effects'];
    for (const field of requiredFields) {
        if (!(field in specData)) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // If missing required fields, return early
    if (errors.length > 0) {
        return errors;
    }

    // Validate name field
    if (typeof specData.name !== 'string' || specData.name.trim() === '') {
        errors.push('Name must be a non-empty string');
    } else if (specData.name.length > 100) {
        errors.push('Name must be 100 characters or less');
    }

    // Validate class field
    if (typeof specData.class !== 'string' || specData.class.trim() === '') {
        errors.push('Class must be a non-empty string');
    } else if (specData.class.length > 50) {
        errors.push('Class must be 50 characters or less');
    }

    // Validate icon_path field
    if (typeof specData.icon_path !== 'string' || specData.icon_path.trim() === '') {
        errors.push('Icon path must be a non-empty string');
    } else if (specData.icon_path.length > 200) {
        errors.push('Icon path must be 200 characters or less');
    } else {
        const iconPathPattern = /^icons\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)$/;
        if (!iconPathPattern.test(specData.icon_path)) {
            errors.push('Icon path must follow pattern: icons/[subfolder/]filename.(png|jpg|jpeg|svg)');
        }
    }

    // Validate effects array
    if (!Array.isArray(specData.effects)) {
        errors.push('Effects must be an array');
    } else if (specData.effects.length > 50) {
        errors.push('Effects array must have 50 items or less');
    } else {
        // Validate each effect
        specData.effects.forEach((effect, index) => {
            if (!validateEffect(effect)) {
                errors.push(`Effect at index ${index} is invalid`);
            } else {
                // Additional validation for effect icon_path
                if (typeof effect.icon_path !== 'string' || effect.icon_path.trim() === '') {
                    errors.push(`Effect "${effect.name}" at index ${index}: Icon path must be a non-empty string`);
                } else if (effect.icon_path.length > 200) {
                    errors.push(`Effect "${effect.name}" at index ${index}: Icon path must be 200 characters or less`);
                } else {
                    const effectIconPathPattern = /^icons\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|svg)$/;
                    if (!effectIconPathPattern.test(effect.icon_path)) {
                        console.warn(`Effect "${effect.name}" at index ${index}: Icon path doesn't follow pattern: icons/[subfolder/]filename.(png|jpg|jpeg|svg) - will use fallback`);
                        // Don't add to errors since we have fallback handling
                    }
                }
            }
        });
    }

    return errors;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        validateSpecializationData,
        validateEffect,
        getValidationErrors
    };
} else {
    // Browser environment
    window.SpecializationValidator = {
        validateSpecializationData,
        validateEffect,
        getValidationErrors
    };
} 