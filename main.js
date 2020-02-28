// Global constants
const BACKGROUND_COLOR = 'hsl(203, 31%, 71%)';                          // (same as '--button-face' value in style.css)
const POPULATION = { MIN: 2, DEFAULT: 50, MAX: 100 };                   // "Population Size" slider range & default
const CITIES = { MIN: 10, DEFAULT: 100, MAX: 300 };                     // "Number of Cities" slider range & default
const MUTATION = { MIN: 1, DEFAULT: 10, MAX: 99 };                      // "Mutation Rate" slider range & default
const STATUS_UPDATE_RATE_MSEC = 100;                                    // Max number of milliseconds between Status (UI) updates
const VIEW_UPDATE_RATE_MSEC = 50;                                       // Max number of milliseconds between View (UI) updates

// DOM elements
let canvas                                                              // p5 canvas DOM element
let canvasWrapper                                                       // Parent of canvas element in the DOM
let toggleRunButton, resetButton                                        // Start/Pause and Reset button DOM elements
let populationSizeSlider, numCitiesSlider, mutationRateSlider           // Slider DOM elements
let status1Generation, status2Length, status3Time, status4GPS           // Status DOM elements

// Variables
let accumMillis = 0, startMillis = 0                                    // Elapsed Time counter
let isRunning = false                                                   // true if started, false if paused
let nextStatusUpdateTimeMsec = 0, nextViewUpdateTimeMsec = 0            // Saved millisecond counts, used to time periodic UI updates
let windowToCanvasOverhead = { width: undefined, height: undefined }    // Metrics gathered at startup for use on window resize

// Instances
let population, problem                                                 // Instances of Population and Problem classes
let graphView, mapView                                                  // Instances of view classes

/**
 * Called once when the program starts to do initialization
 */
function setup() {
    // Get some metrics for resizing
    canvasWrapper = select('#canvas-wrapper') // Parent element of canvas
    windowToCanvasOverhead.width = windowWidth - canvasWrapper.width;
    windowToCanvasOverhead.height = windowHeight - canvasWrapper.height;

    canvas = createCanvas(canvasWrapper.width, canvasWrapper.height);
    canvas.parent('canvas-wrapper');

    // Status
    status1Generation = select('#status-1-generation');
    status2Length = select('#status-2-length');
    status3Time = select('#status-3-time');
    status4GPS = select('#status-4-gps');

    // Buttons
    toggleRunButton = select('#toggle-run');
    toggleRunButton.mousePressed(onClickToggleRun);

    resetButton = select('#reset');
    resetButton.mousePressed(onClickReset);

    // Sliders and their (dynamic) labels
    populationSizeSlider = select('#population-sldr');
    populationSizeSlider.elt.min = POPULATION.MIN;
    populationSizeSlider.elt.max = POPULATION.MAX;
    populationSizeSlider.value(POPULATION.DEFAULT);
    populationSizeSlider.input(onChangedPopulationSize);
    populationSizeDisp = select('#population-size');
    populationSizeDisp.elt.innerText = populationSizeSlider.value();

    numCitiesSlider = select('#cities-sldr');
    numCitiesSlider.elt.min = CITIES.MIN;
    numCitiesSlider.elt.max = CITIES.MAX;
    numCitiesSlider.value(CITIES.DEFAULT);
    numCitiesSlider.input(onChangedNumCities);
    numCitiesDisp = select('#num-cities');
    numCitiesDisp.elt.innerText = numCitiesSlider.value();

    mutationRateSlider = select('#mutation-sldr');
    mutationRateSlider.elt.min = MUTATION.MIN;
    mutationRateSlider.elt.max = MUTATION.MAX;
    mutationRateSlider.value(MUTATION.DEFAULT);
    mutationRateSlider.input(onChangedMutationRate);
    mutationRateDisp = select('#mutation-rate');
    mutationRateDisp.elt.innerText = `${mutationRateSlider.value()}%`;

    // // Crossover algorithm
    // crossoverRadio = createRadio();
    // crossoverRadio.position(10, 10);
    // crossoverRadio.option('Cycle');
    // crossoverRadio.option('Direct Insertion');
    // crossoverRadio.option('Edge Recombination');
    // crossoverRadio.option('Order 1');
    // crossoverRadio.option('Order Multiple');
    // crossoverRadio.option('PMX');
    // crossoverRadio.style('width', '60px');
    // crossoverRadio.changed(onChangedCrossoverAlgo);

    // // Mutation algorithm
    // mutationSelection = createSelect();
    // mutationSelection.position(10, 10);
    // mutationSelection.option('Insertion');
    // mutationSelection.option('Inversion');
    // mutationSelection.option('Random Slide');
    // mutationSelection.option('Random Swap');
    // mutationSelection.option('Scramble');
    // mutationSelection.option('Single Swap');
    // mutationSelection.changed(onChangedMutationAlgo);

    reset();
}

/**
 * Starts processing
 */
function start() {
    // Start/re-start the Elapsed Time counter
    startMillis = millis();

    // Redraw immediately
    nextStatusUpdateTimeMsec = 0;
    nextViewUpdateTimeMsec = 0;

    isRunning = true;
    toggleRunButton.elt.innerText = 'Pause';
    toggleRunButton.removeClass('start-button');
    toggleRunButton.addClass('pause-button');
}

/**
 * Pauses processing
 */
function pause() {
    // Pause the Elapsed Time counter
    accumMillis += millis() - startMillis;
    startMillis = 0;

    // Redraw immediately
    nextStatusUpdateTimeMsec = 0;
    nextViewUpdateTimeMsec = 0;

    isRunning = false;
    toggleRunButton.elt.innerText = 'Start';
    toggleRunButton.removeClass('pause-button');
    toggleRunButton.addClass('start-button');
}

/**
 * Resets the app to initial state
 */
function reset() {
    pause();

    // Reset the Elapsed Time counter
    accumMillis = 0;
    startMillis = 0;

    // Redraw immediately
    nextStatusUpdateTimeMsec = 0;
    nextViewUpdateTimeMsec = 0;

    // TODO - reuse existing objects instead of discarding and re-creating
    population = new Population(POPULATION.DEFAULT, numCitiesSlider.value());
    problem = new Problem(numCitiesSlider.value());

    mapView = new MapView(problem, 0, 0, canvas.width, 0.6 * canvas.height);
    graphView = new GraphView(problem, 0, mapView.bottom + 12, canvas.width, canvas.height - (mapView.bottom + 12));
}

/**
 * Called directly after setup(), and then continuously afterward
 */
function draw() {
    if (isRunning) {
        const timeLimit = millis() + 16; // 16.66 millis = 1/60th of a second
        const newPopulationSize = populationSizeSlider.value();
        const mutationRate = mutationRateSlider.value() / 100.0;

        // Do as much processing as possible within a single frame (~ 1/60 second)
        do {
            // Evaluate the current generation
            problem.evaluate(population.individuals);

            // Create the next generation of individuals based upon this generation's individual scores
            population.selection(newPopulationSize, mutationRate);

            if (millis() > nextStatusUpdateTimeMsec) {
                updateStatus();
            }

            if (millis() > nextViewUpdateTimeMsec) {
                updateViews();
            }
        } while (millis() < timeLimit);
    } else {
        // No need to update these at 60 fps...
        if (millis() > nextStatusUpdateTimeMsec) {
            updateStatus();
        }

        if (millis() > nextViewUpdateTimeMsec) {
            updateViews();
        }
    }
}

function updateStatus() {
    // Update Path-Length display
    status2Length.elt.innerText = (problem.history.length > 0)
        ? nfc(problem.history[problem.history.length - 1], 1)
        : '...';

    // Update Generation-Number display
    status1Generation.elt.innerText = nfc(population.generation);

    // Update Elapsed-Time display
    const elapsedSec = isRunning
        ? int((millis() - startMillis + accumMillis) / 1000)
        : int(accumMillis / 1000);
    const elapsedMin = int(elapsedSec / 60);
    const elapsedHour = int(elapsedMin / 24);
    status3Time.elt.innerText = `${nf(elapsedHour, 2)}:${nf(elapsedMin % 60, 2)}:${nf(elapsedSec % 60, 2)}`;

    // Update Generations-Per-Second display
    status4GPS.elt.innerText = (elapsedSec >= 1)
        ? int(population.generation / elapsedSec)
        : '...';

    nextStatusUpdateTimeMsec = millis() + STATUS_UPDATE_RATE_MSEC;
}

function updateViews() {
    background(BACKGROUND_COLOR);

    mapView.show();
    graphView.show();

    nextViewUpdateTimeMsec = millis() + VIEW_UPDATE_RATE_MSEC;
}

/**
 * Called when the Start/Pause button is clicked
 */
function onClickToggleRun() {
    if (isRunning) {
        pause();
    } else {
        start();
    }
}

/**
 * Called when the Reset button is clicked
 */
function onClickReset() {
    reset();
}

/**
 * Called when the "Population Size" slider position is changed
 */
function onChangedPopulationSize() {
    populationSizeDisp.elt.innerText = populationSizeSlider.value();
}

/**
 * Called when the "Number of Cities" slider position is changed
 */
function onChangedNumCities() {
    numCitiesDisp.elt.innerText = numCitiesSlider.value();

    reset();
}

/**
 * Called when the "Mutation Rate" slider position is changed
 */
function onChangedMutationRate() {
    mutationRateDisp.elt.innerText = `${mutationRateSlider.value()}%`;
}

/**
 * Called once every time the browser window is resized
 */
function windowResized() {
    const newWidth = windowWidth - windowToCanvasOverhead.width;
    const newHeight = windowHeight - windowToCanvasOverhead.height;
    if (newWidth > 480 && newHeight > 800) {  // (480x800 is arbitrary; just need to ensure neither size goes negative...)
        resizeCanvas(newWidth, newHeight);
        mapView.resize(0, 0, newWidth, 0.6 * newHeight);
        graphView.resize(0, mapView.bottom + 12, newWidth, newHeight - (mapView.bottom + 12));
    }
}
