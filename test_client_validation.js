#!/usr/bin/env node
/**
 * Node.js test script for client-side validation functions
 */

// Mock browser environment
global.window = {};
global.document = {};

// Load the validation module
const fs = require('fs');
const path = require('path');

// Read the validation script
const validatorScript = fs.readFileSync(path.join(__dirname, 'static/js/specialization-validator.js'), 'utf8');

// Execute the script to load the functions
eval(validatorScript);

// Test data
const validSpecialization = {
    name: "Arms Warrior",
    class: "Warrior",
            icon_path: "raidicons/arms_warrior.png",
    effects: [
        {
            name: "Battle Shout",
            type: "buff",
            scope: "raid",
            description: "Increases attack power by 185 for all raid members"
        }
    ]
};

const invalidSpecialization = {
    name: "Invalid Spec",
    class: "Warrior",
    // Missing icon_path and effects
};

const invalidEffectType = {
    name: "Test Spec",
    class: "Warrior",
    icon_path: "raidicons/test.png",
    effects: [
        {
            name: "Invalid Effect",
            type: "invalid_type", // Invalid type
            scope: "raid",
            description: "This should fail"
        }
    ]
};

const invalidEffectScope = {
    name: "Test Spec",
    class: "Warrior",
    icon_path: "raidicons/test.png",
    effects: [
        {
            name: "Invalid Effect",
            type: "buff",
            scope: "invalid_scope", // Invalid scope
            description: "This should fail"
        }
    ]
};

const emptyStrings = {
    name: "", // Empty string
    class: "Warrior",
    icon_path: "raidicons/test.png",
    effects: []
};

const wrongDataTypes = {
    name: 123, // Wrong type
    class: "Warrior",
    icon_path: "raidicons/test.png",
    effects: []
};

// Test functions
function testValidSpecialization() {
    const result = window.SpecializationValidator.validateSpecializationData(validSpecialization);
    console.log(`✅ Valid Specialization: ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testInvalidSpecialization() {
    const result = !window.SpecializationValidator.validateSpecializationData(invalidSpecialization);
    console.log(`✅ Invalid Specialization (Missing Fields): ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testInvalidEffectType() {
    const result = !window.SpecializationValidator.validateSpecializationData(invalidEffectType);
    console.log(`✅ Invalid Effect Type: ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testInvalidEffectScope() {
    const result = !window.SpecializationValidator.validateSpecializationData(invalidEffectScope);
    console.log(`✅ Invalid Effect Scope: ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testEmptyStrings() {
    const result = !window.SpecializationValidator.validateSpecializationData(emptyStrings);
    console.log(`✅ Empty Name String: ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testWrongDataTypes() {
    const result = !window.SpecializationValidator.validateSpecializationData(wrongDataTypes);
    console.log(`✅ Wrong Data Types: ${result ? 'PASS' : 'FAIL'}`);
    return result;
}

function testValidationErrors() {
    const errors = window.SpecializationValidator.getValidationErrors(emptyStrings);
    const hasErrors = errors.length > 0;
    console.log(`✅ Validation Error Messages: ${hasErrors ? 'PASS' : 'FAIL'} (${errors.length} errors found)`);
    if (errors.length > 0) {
        console.log('   Errors:', errors);
    }
    return hasErrors;
}

function testRealSpecializationFiles() {
    console.log('\nTesting real specialization files...');
    
    const specializationDir = path.join(__dirname, 'specializations');
    const files = fs.readdirSync(specializationDir)
        .filter(file => file.endsWith('.json') && file !== 'specialization_schema.json');
    
    let passed = 0;
    let total = files.length;
    
    for (const filename of files) {
        try {
            const filePath = path.join(specializationDir, filename);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const specData = JSON.parse(fileContent);
            
            const isValid = window.SpecializationValidator.validateSpecializationData(specData);
            if (isValid) {
                console.log(`  ✅ ${filename}: PASS`);
                passed++;
            } else {
                console.log(`  ❌ ${filename}: FAIL`);
                const errors = window.SpecializationValidator.getValidationErrors(specData);
                console.log(`     Errors: ${errors.join(', ')}`);
            }
        } catch (error) {
            console.log(`  ❌ ${filename}: ERROR - ${error.message}`);
        }
    }
    
    console.log(`\nReal file test results: ${passed}/${total} files passed`);
    return passed === total;
}

// Run all tests
function runAllTests() {
    console.log('Client-Side Validation Tests');
    console.log('=' * 40);
    
    const tests = [
        testValidSpecialization,
        testInvalidSpecialization,
        testInvalidEffectType,
        testInvalidEffectScope,
        testEmptyStrings,
        testWrongDataTypes,
        testValidationErrors
    ];
    
    let passed = 0;
    let total = tests.length;
    
    tests.forEach(test => {
        if (test()) {
            passed++;
        }
    });
    
    console.log('\n' + '=' * 40);
    console.log(`Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All validation tests passed!');
    } else {
        console.log('⚠️  Some tests failed - check the output above');
    }
    
    // Test real files
    testRealSpecializationFiles();
}

// Run the tests
runAllTests(); 