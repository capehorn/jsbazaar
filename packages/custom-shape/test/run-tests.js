import "./unit-tests/custom-shape.test.js";


mocha.checkLeaks();
mocha.run(function(failures) {
    console.log("All tests are passing: " + !failures);
});