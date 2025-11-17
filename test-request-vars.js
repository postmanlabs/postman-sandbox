#!/usr/bin/env node
/**
 * Integration test for pm.requestVariables feature
 * 
 * This test verifies that:
 * 1. pm.requestVariables is accessible in both prerequest and test scripts
 * 2. Values set in prerequest script persist to test script
 * 3. The underlying VariableScope instance is modified correctly
 */

const postmanRuntime = require('postman-runtime');
const { Collection, VariableScope } = require('postman-collection');

// Create a collection with prerequest and test scripts
const collection = new Collection({
    item: [{
        name: 'Test Request Variables',
        event: [
            {
                listen: 'prerequest',
                script: {
                    exec: [
                        'console.log("=== Prerequest Script ===")',
                        'console.log("Initial requestVariables:", pm.requestVariables.toObject())',
                        '',
                        '// Set some values',
                        'pm.requestVariables.set("currentPage", 1)',
                        'pm.requestVariables.set("totalPages", 10)',
                        'pm.requestVariables.set("items", ["item1", "item2"])',
                        '',
                        'console.log("After setting values:", pm.requestVariables.toObject())',
                        '',
                        '// Verify has() works',
                        'console.log("Has currentPage:", pm.requestVariables.has("currentPage"))',
                        'console.log("Has nonexistent:", pm.requestVariables.has("nonexistent"))'
                    ]
                }
            },
            {
                listen: 'test',
                script: {
                    exec: [
                        'console.log("\\n=== Test Script ===")',
                        'console.log("requestVariables in test:", pm.requestVariables.toObject())',
                        '',
                        '// Verify values set in prerequest are accessible',
                        'const currentPage = pm.requestVariables.get("currentPage")',
                        'const totalPages = pm.requestVariables.get("totalPages")',
                        'const items = pm.requestVariables.get("items")',
                        '',
                        'console.log("currentPage:", currentPage)',
                        'console.log("totalPages:", totalPages)',
                        'console.log("items:", items)',
                        '',
                        '// Run assertions',
                        'pm.test("currentPage should be 1", function() {',
                        '    pm.expect(currentPage).to.equal(1)',
                        '})',
                        '',
                        'pm.test("totalPages should be 10", function() {',
                        '    pm.expect(totalPages).to.equal(10)',
                        '})',
                        '',
                        'pm.test("items should be an array", function() {',
                        '    pm.expect(items).to.be.an("array")',
                        '    pm.expect(items).to.have.lengthOf(2)',
                        '})',
                        '',
                        'pm.test("has() should work correctly", function() {',
                        '    pm.expect(pm.requestVariables.has("currentPage")).to.be.true',
                        '    pm.expect(pm.requestVariables.has("nonexistent")).to.be.false',
                        '})',
                        '',
                        '// Modify a value',
                        'pm.requestVariables.set("currentPage", 2)',
                        'console.log("Updated currentPage to:", pm.requestVariables.get("currentPage"))',
                        '',
                        '// Test unset',
                        'pm.requestVariables.unset("totalPages")',
                        'console.log("After unsetting totalPages:", pm.requestVariables.toObject())'
                    ]
                }
            }
        ],
        request: {
            url: 'https://postman-echo.com/get',
            method: 'GET'
        }
    }]
});

// Create a VariableScope with initial values
const requestVariables = new VariableScope({
    values: [
        { key: 'initialValue', value: 'test' }
    ]
});

console.log('Starting integration test for pm.requestVariables\n');
console.log('Initial requestVariables state:', requestVariables.toObject());
console.log('');

// Start the runner
postmanRuntime.run(collection, {
    requestVariables: requestVariables,
    timeout: {
        request: 10000
    }
}, function (err, run) {
    if (err) {
        console.error('Error starting runner:', err);
        process.exit(1);
    }
    
    // Handle runner events
    run.start({
        console: function (cursor, level, ...messages) {
            console.log('[Script]', level + ':', ...messages);
        },
        assertion: function (cursor, assertions) {
            assertions.forEach(function (assertion) {
                if (assertion.error) {
                    console.log('✗ Assertion failed:', assertion.assertion, '-', assertion.error.message);
                } else {
                    console.log('✓ Assertion passed:', assertion.assertion);
                }
            });
        },
        done: function (err) {
            if (err) {
                console.error('Runner error:', err);
                process.exit(1);
            }
            
            console.log('\n=== Final State ===');
            console.log('Final requestVariables:', requestVariables.toObject());
            
            // Verify final state
            const finalState = requestVariables.toObject();
            
            console.log('\n=== Verification ===');
            
            let allPassed = true;
            
            // Check that currentPage was updated to 2
            if (finalState.currentPage === 2) {
                console.log('✓ currentPage correctly updated to 2');
            } else {
                console.log('✗ currentPage should be 2, got:', finalState.currentPage);
                allPassed = false;
            }
            
            // Check that totalPages was unset
            if (!finalState.hasOwnProperty('totalPages')) {
                console.log('✓ totalPages correctly unset');
            } else {
                console.log('✗ totalPages should be unset, got:', finalState.totalPages);
                allPassed = false;
            }
            
            // Check that items array persists
            if (Array.isArray(finalState.items) && finalState.items.length === 2) {
                console.log('✓ items array persists correctly');
            } else {
                console.log('✗ items should be array with 2 elements, got:', finalState.items);
                allPassed = false;
            }
            
            // Check that initialValue still exists
            if (finalState.initialValue === 'test') {
                console.log('✓ initialValue persists correctly');
            } else {
                console.log('✗ initialValue should be "test", got:', finalState.initialValue);
                allPassed = false;
            }
            
            console.log('\n=== Test Summary ===');
            if (allPassed) {
                console.log('✓ All integration tests passed!');
                process.exit(0);
            } else {
                console.log('✗ Some integration tests failed');
                process.exit(1);
            }
        }
    });
});
