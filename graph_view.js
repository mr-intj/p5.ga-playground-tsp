/**
 * Renders a graph view for the solution history of the specified Problem instance.
 */
class GraphView {
    static get VIEW_BACKGROUND() { return '#fffffe'; }
    static get BORDER_WIDTH() { return 1.5; }
    static get BORDER_COLOR() { return '#000000'; }
    static get PADDING() { return 10; }
    static get PLOT_COLOR() { return '#E00000'; }
    static get MAJOR_DIV_COLOR() { return '#808080'; }
    static get MINOR_DIV_COLOR() { return '#E0E0E0'; }
    static get NC_OFFSET() { return GraphView.BORDER_WIDTH + GraphView.PADDING; }
    static get X_AXIS_GUTTER() { return 50; }
    static get Y_AXIS_GUTTER() { return 15; }

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
        this.clientLeft = this.left + GraphView.NC_OFFSET;
        this.clientTop = this.top + GraphView.NC_OFFSET;
        this.clientWidth = this.width - 2 * GraphView.NC_OFFSET;
        this.clientHeight = this.height - 2 * GraphView.NC_OFFSET;

        // Graph area metrics (excludes axis labels)
        this.graphLeft = 0;
        this.graphTop = 0;
        this.graphWidth = this.clientWidth - GraphView.X_AXIS_GUTTER;
        this.graphHeight = this.clientHeight - GraphView.Y_AXIS_GUTTER;
        this.graphRight = this.graphLeft + this.graphWidth - 1;
        this.graphBottom = this.graphTop + this.graphHeight - 1;
}

    /**
     * Returns the major and minor step sizes for the graph's X or Y axis
     * @param {Number} inputRange - history index or (zero-based) distance
     * @param {Number} graphWidthOrHeight - width/height of the graph (in pixels)
     * @param {Number} majDivMinSize - minimum number of pixels between major divisions
     * @returns {Object} - Object containing the major and minor step sizes (in input units)
     */
    calcStepSizes(inputRange, graphWidthOrHeight, majDivMinSize) {
        const scales = [
            [       5,       1],
            [      10,       2], [      20,       5], [      50,       10],
            [     100,      20], [     200,      50], [     500,      100],
            [    1000,     200], [    2000,     500], [    5000,     1000],
            [   10000,    2000], [   20000,    5000], [   50000,    10000],
            [  100000,   20000], [  200000,   50000], [  500000,   100000],
            [ 1000000,  200000], [ 2000000,  500000], [ 5000000,  1000000],
            [10000000, 2000000], [20000000, 5000000], [50000000, 10000000]
        ];
        const ratio = graphWidthOrHeight / majDivMinSize;
        for (let divisions of scales) {
            if (inputRange <= divisions[0] * ratio) {
                return { major: divisions[0], minor: divisions[1] };
            }
        }
        console.assert(false);
    }

    /**
     * Convert a history index to the corresponding graph X-coordinate
     *
     * @param {Number} index - Zero-based index into the history
     * @return {Number} - Cooresponding client X-coordinate on the graph
     */
    toClientX(index) {
        // console.assert(index >= 0, `index (${index}) is less than zero`)
        // console.assert(index < this.problem.history.length, `index (${index}) is greater than ${this.problem.history.length - 1}`)

        if (this.problem.history.length < 2) {  // Avoid divide-by-zero
            return this.graphLeft;
        }

        const ratio = index / (this.problem.history.length - 1);
        const graphX = Math.floor(ratio * this.graphRight);
        // console.assert(graphX >= this.graphLeft, `graphX (${graphX}) is less than ${this.graphLeft}`);
        // console.assert(graphX <= this.graphRight, `graphX (${graphX}) is greater than ${this.graphRight}`);

        return graphX;
    }

    /**
     * Convert a graph X-coordinate to the corresponding history index
     *
     * @param {Number} graphX - Client X-coordinate on the graph
     * @return {Number} - Zero-based index into the history
     */
    toHistoryIndex(graphX) {
        // console.assert(graphX >= this.graphLeft, `graphX (${graphX}) is less than ${this.graphLeft}`);
        // console.assert(graphX <= this.graphRight, `graphX (${graphX}) is greater than ${this.graphRight}`);

        const ratio = graphX / this.graphRight;
        const index = Math.floor(ratio * (this.problem.history.length - 1));
        // console.assert(index >= 0, `index (${index}) is less than zero`);
        // console.assert(index < this.problem.history.length, `index (${index}) is greater than ${this.problem.history.length - 1}`);

        return index;
    }

    /**
     * Convert a solution path distance to the corresponding graph Y-coordinate
     *
     * @param {Number} distance - Solution path distance value
     * @return {Number} - Cooresponding client Y-coordinate on the graph
     */
    toClientY(distance) {
        // console.assert(distance >= problem.minDistance, `distance (${distance}) is less than ${problem.minDistance}`);
        // console.assert(distance <= problem.maxDistance, `distance (${distance}) is greater than ${problem.maxDistance}`);

        if (problem.maxDistance - problem.minDistance < Number.EPSILON) {  // Avoid divide-by-zero
            return this.graphBottom;
        }

        const ratio = (distance - problem.minDistance) / (problem.maxDistance - problem.minDistance);
        const graphY = Math.floor(this.graphBottom - (ratio * this.graphBottom));
        // console.assert(graphY >= this.graphTop, `graphY (${graphY}) is less than ${this.graphTop}`);
        // console.assert(graphY <= this.graphBottom, `graphY (${graphY}) is greater than ${this.graphBottom}`);

        return graphY;
    }

    /**
     * Convert a graph Y-coordinate to the corresponding solution path distance
     *
     * @param {Number} graphY - Client Y-coordinate on the graph
     * @return {Number} - Solution path distance value
     */
    toHistoryDistance(graphY) {
        // console.assert(graphY >= this.graphTop, `graphY (${graphY}) is less than ${this.graphTop}`);
        // console.assert(graphY <= this.graphBottom, `graphY (${graphY}) is greater than ${this.graphBottom}`);

        const ratio = (problem.maxDistance - problem.minDistance) / this.graphBottom;
        const distance = problem.minDistance + ratio * (this.graphBottom - graphY);
        // console.assert(distance >= problem.minDistance, `distance (${distance}) is less than ${problem.minDistance}`);
        // console.assert(distance <= problem.maxDistance, `distance (${distance}) is greater than ${problem.maxDistance}`);

        return distance;
    }

    /**
     * Called by global draw() function to render this view
     */
    show() {
        push();

        // Fill the view with background color and draw the NC border
        stroke(GraphView.BORDER_COLOR);
        fill(GraphView.VIEW_BACKGROUND);
        strokeWeight(GraphView.BORDER_WIDTH);
        rect(this.left, this.top, this.width, this.height);

        // Render the "client area" contents
        translate(this.clientLeft + GraphView.X_AXIS_GUTTER, this.clientTop);

        // Draw X- and Y-axes
        textFont('Arial', 16);
        fill(GraphView.BORDER_COLOR);
        const xSteps = this.drawAxisX();
        this.drawAxisY();

        // Plot history vs distance
        stroke(GraphView.PLOT_COLOR);
        strokeWeight(2);
        let x1 = -1, y1 = -1;
        for (let i = 0, j = this.problem.history.length; i < j; i += xSteps.minor) {
            const x2 = this.toClientX(i);
            const y2 = this.toClientY(this.problem.history[i]);
            if (x1 > -1) {
                line(x1, y1, x2, y2);
            }
            [x1, y1] = [x2, y2];
        }

        pop();
    }

    /**
     * Renders the X-axis and labels
     *
     * @returns {Object} - Object containing the major and minor X step sizes (in history index units)
     */
    drawAxisX() {
        // Draw X-axis and major/minor vertical grid lines
        const majDivMinSize = int(Math.log10(this.problem.history.length) * 13) + 6;
        const xSteps = this.calcStepSizes(this.problem.history.length, this.graphWidth, majDivMinSize);

        textAlign(CENTER, TOP);

        for (let i = 0, j = this.problem.history.length; i < j; i += xSteps.minor ) {
            const x = this.toClientX(i);
            if (i === 0) {
                // X-axis
                stroke(GraphView.VIEW_BACKGROUND);
                text(nfc(i), x, this.graphBottom + 5);
                stroke(GraphView.BORDER_COLOR);
                strokeWeight(2);
            } else if (i % xSteps.major === 0) {
                // X major division
                stroke(GraphView.VIEW_BACKGROUND);
                text(nfc(i), x, this.graphBottom + 5);
                stroke(GraphView.MAJOR_DIV_COLOR);
            } else if (i % xSteps.minor !== 0) {
                continue;
            }
            // fall-through for X minor division
            line(x, this.graphTop, x, this.graphBottom - 2);
            strokeWeight(1);
            stroke(GraphView.MINOR_DIV_COLOR);
        }

        return xSteps;
    }

    /**
     * Renders the Y-axis and labels
     */
    drawAxisY() {
        // Draw Y-axis and major/minor horizontal grid lines
        const majDivMinSize = 26;
        const ySteps = this.calcStepSizes(problem.maxDistance - problem.minDistance, this.graphHeight, majDivMinSize);

        textAlign(RIGHT, CENTER);

        const rangeFrom = Math.ceil(problem.minDistance);
        const rangeTo = Math.floor(problem.maxDistance);
        for (let distance = rangeFrom; distance <= rangeTo; distance++) {
            const y = this.toClientY(distance);
            if (distance === rangeFrom) {
                // Y-axis
                stroke(GraphView.VIEW_BACKGROUND);
                fill(GraphView.MAJOR_DIV_COLOR);
                text(nfc(distance), this.graphLeft - 5, y);
                stroke(GraphView.BORDER_COLOR);
                strokeWeight(2);
            } else if (distance % ySteps.major === 0) {
                // Y major division
                stroke(GraphView.VIEW_BACKGROUND);
                fill(GraphView.BORDER_COLOR);
                text(nfc(distance), this.graphLeft - 5, y);
                stroke(GraphView.MAJOR_DIV_COLOR);
                if (distance !== rangeTo) {
                    distance = Math.min(rangeTo - 1, distance + ySteps.minor - 1);
                }
            } else if (distance % ySteps.minor === 0) {
                // Y minor division
                if (distance !== rangeTo) {
                    distance = Math.min(rangeTo - 1, distance + ySteps.minor - 1);
                }
            } else if (distance === rangeTo) {
                stroke(GraphView.VIEW_BACKGROUND);
                fill(GraphView.MAJOR_DIV_COLOR);
                text(nfc(distance), this.graphLeft - 5, y);
                continue;
            } else {
                continue;
            }
            line(this.graphLeft + 2, y, this.graphRight, y);
            strokeWeight(1);
            stroke(GraphView.MINOR_DIV_COLOR);
        }
    }
}