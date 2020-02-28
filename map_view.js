/**
 * Renders a map view of the specified Problem instance and its best solution so far.
 */
class MapView {
    static get VIEW_BACKGROUND() { return '#fffffe'; }
    static get BORDER_WIDTH() { return 1.5; }
    static get BORDER_COLOR() { return '#000000'; }
    static get PADDING() { return 10; }
    static get PATH_COLOR() { return 'darkgray'; }
    static get CITY_STROKE() { return 'black'; }
    static get CITY_FILL() { return 'lightgreen'; }
    static get NC_OFFSET() { return MapView.BORDER_WIDTH + MapView.PADDING; }

    /**
     * Initializes a new instance of this class
     *
     * @param {Problem} problem
     * @param {Number} x - Leftmost position of this view (in pixels)
     * @param {Number} y - Topmost position of this view (in pixels)
     * @param {Number} width - Width of this view (in pixels)
     * @param {Number} height - Height of this view (in pixels)
     */
    constructor(problem, x, y, width, height) {
        this.problem = problem;
        this.resize(x, y, width, height);
    }

    /**
     * Calculates/recalculates position and size of this view
     *
     * @param {Number} x - Leftmost position of this view (in pixels)
     * @param {Number} y - Topmost position of this view (in pixels)
     * @param {Number} width - Width of this view (in pixels)
     * @param {Number} height - Height of this view (in pixels)
     */
    resize(x, y, width, height) {
        console.assert(Math.floor(x) >= 0, `x (${Math.floor(x)}) is less than zero`);
        console.assert(Math.floor(width) >= 1, `width (${Math.floor(width)}) is less than one`);
        console.assert(Math.floor(y) >= 0, `y (${Math.floor(y)}) is less than zero`);
        console.assert(Math.floor(height) >= 1, `height (${Math.floor(height)}) is less than one`);

        // View metrics
        this.left = Math.floor(x);
        this.top = Math.floor(y);
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        this.right = this.left + this.width - 1;
        this.bottom = this.top + this.height - 1;

        // Client area metrics
        this.clientLeft = this.left + MapView.NC_OFFSET;
        this.clientTop = this.top + MapView.NC_OFFSET;
        this.clientWidth = this.width - 2 * MapView.NC_OFFSET;
        this.clientHeight = this.height - 2 * MapView.NC_OFFSET;
        this.scaleX = this.clientWidth / Problem.WIDTH;
        this.scaleY = this.clientHeight / Problem.HEIGHT;
        this.cityRadius = Math.min(this.clientWidth / 60, this.clientHeight / 60);
    }

    /**
     * Called by global draw() function to render this view
     */
    show() {
        push();

        // Fill the view with background color and draw the NC border
        stroke(MapView.BORDER_COLOR);
        strokeWeight(MapView.BORDER_WIDTH);
        fill(MapView.VIEW_BACKGROUND);
        rect(this.left, this.top, this.width, this.height);

        // Render the "client area" contents
        translate(this.clientLeft, this.clientTop);
        strokeWeight(2);

        // If a "best solution" is present, plot its path
        if (this.problem.history.length > 0) {
            stroke(MapView.PATH_COLOR);
            let lastIdx = -1;
            for (let idx of this.problem.bestSolution.alleles) {
                if (lastIdx >= 0) {
                    const lastCity = this.problem.cities[lastIdx];
                    const city = this.problem.cities[idx];
                    line(lastCity.x * this.scaleX, lastCity.y * this.scaleY, city.x * this.scaleX, city.y * this.scaleY);
                }
                lastIdx = idx;
            }
        }

        // Render city map
        stroke(MapView.CITY_STROKE);
        strokeWeight(2);
        fill(MapView.CITY_FILL);
        for (let i = 0, j = this.problem.cities.length; i < j; i++) {
            const city = this.problem.cities[i];
            ellipse(city.x * this.scaleX, city.y * this.scaleY, this.cityRadius, this.cityRadius);
        }

        pop();
    }
}