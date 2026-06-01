module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    verbose: true,
    forceExit: true,
    reporters: [
        "default",
        ["jest-html-reporter", {
            "pageTitle": "Test Report",
            "outputPath": "./test-report.html"
        }]
    ]
};
