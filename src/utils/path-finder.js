const { abs, max, pow, sqrt } = Math;
const noop = () => {};

// the world data is presented in integers:
// anything higher than this number is considered blocked
// this is handy is you use numbered sprites, more than one
// of which is walkable road, grass, mud, etc
let maxWalkableTileNum = 0;

/**
 * @param {Object} world
 * @param {number} startX
 * @param {number} startY
 * @param {number} targetX
 * @param {number} targetY
 * @return {Array<{ x: number, y:number }>} Array of possible paths to take
 *         will be empty when no possible path is found
 */
const findPath = ( world, startX, startY, targetX, targetY ) => {
    const pathStart = [ startX,  startY  ];
    const pathEnd   = [ targetX, targetY ];

    // keep track of the world dimensions
    // Note that this A-star implementation expects the world array to be square:
    // it must have equal height and width. If your game world is rectangular,
    // just fill the array with dummy values to pad the empty space.
    const { width, height, terrain } = world;
    const worldSize = width * height;

    // which heuristic should we use?
    // default: no diagonals (Manhattan)
    const distanceFunction = ManhattanDistance;
    const findNeighbours   = noop;

    /*
    // alternate heuristics, depending on your game:

    // diagonals allowed but no sqeezing through cracks:
    const distanceFunction = DiagonalDistance;
    const findNeighbours = DiagonalNeighbours;

    // diagonals and squeezing through cracks allowed:
    const distanceFunction = DiagonalDistance;
    const findNeighbours = DiagonalNeighboursFree;

    // euclidean but no squeezing through cracks:
    const distanceFunction = EuclideanDistance;
    const findNeighbours = DiagonalNeighbours;

    // euclidean and squeezing through cracks allowed:
    const distanceFunction = EuclideanDistance;
    const findNeighbours = DiagonalNeighboursFree;
    */

    // Neighbours functions, used by findNeighbours function
    // to locate adjacent available cells that aren't blocked

    // Returns every available North, South, East or West
    // cell that is empty. No diagonals,
    // unless distanceFunction function is not Manhattan
    function Neighbours( x, y ) {
        const N = y - 1,
        S = y + 1,
        E = x + 1,
        W = x - 1,
        myN = N > -1 && canWalkHere( x, N, width, height ),
        myS = S < height && canWalkHere( x, S, width, height ),
        myE = E < width && canWalkHere( E, y, width, height ),
        myW = W > -1 && canWalkHere( W, y, width, height ),
        result = [];

        if ( myN )
            result.push({ x, y: N });

        if ( myE )
            result.push({ x: E, y });

        if ( myS )
            result.push({ x, y: S });

        if ( myW )
            result.push({ x: W, y });

        findNeighbours( myN, myS, myE, myW, N, S, E, W, result );
        return result;
    }

    // returns every available North East, South East,
    // South West or North West cell - no squeezing through
    // "cracks" between two diagonals
    function DiagonalNeighbours( myN, myS, myE, myW, N, S, E, W, result )
    {
        if ( myN ) {
            if ( myE && canWalkHere( E, N, width, height ))
                result.push({ x: E, y: N });
            if ( myW && canWalkHere( W, N, width, height ))
                result.push({ x: W, y: N });
        }
        if ( myS ) {
            if ( myE && canWalkHere( E, S, width, height ))
                result.push({ x: E, y: S });
            if ( myW && canWalkHere( W, S, width, height ))
                result.push({ x: W, y: S });
        }
    }

    // returns every available North East, South East,
    // South West or North West cell including the times that
    // you would be squeezing through a "crack"
    function DiagonalNeighboursFree( myN, myS, myE, myW, N, S, E, W, result )
    {
        myN = N > -1;
        myS = S < height;
        myE = E < width;
        myW = W > -1;
        if ( myE ) {
            if ( myN && canWalkHere( E, N, width, height  ))
                result.push({ x: E, y: N });

            if ( myS && canWalkHere( E, S, width, height  ))
                result.push({ x: E, y: S });
        }
        if ( myW ) {
            if( myN && canWalkHere( W, N, width, height ))
                result.push({ x: W, y: N });

            if( myS && canWalkHere( W, S, width, height  ))
                result.push({ x: W, y: S });
        }
    }

    // Path function, executes AStar algorithm operations
    function calculatePath() {
        // create Nodes from the Start and End x,y coordinates
        var	mypathStart = Node( null, { x: pathStart[0], y: pathStart[1] }, width);
        var mypathEnd   = Node( null, { x: pathEnd[0],   y: pathEnd[1] }, width);
        // create an array that will contain all world cells
        var AStar = new Array(worldSize);
        // list of currently open Nodes
        var Open = [mypathStart];
        // list of closed Nodes
        var Closed = [];
        // list of the final output array
        var result = [];
        // reference to a Node (that is nearby)
        var myNeighbours;
        // reference to a Node (that we are considering now)
        var myNode;
        // reference to a Node (that starts a path in question)
        var myPath;
        // temp integer variables used in the calculations
        var length, max, min, i, j;
        // iterate through the open list until none are left
        while(length = Open.length)
        {
            max = worldSize;
            min = -1;
            for(i = 0; i < length; i++)
            {
                if(Open[i].f < max)
                {
                    max = Open[i].f;
                    min = i;
                }
            }
            // grab the next node and remove it from Open array
            myNode = Open.splice(min, 1)[0];
            // is it the destination node?
            if(myNode.value === mypathEnd.value)
            {
                myPath = Closed[Closed.push(myNode) - 1];
                do
                {
                    result.push({ x: myPath.x, y: myPath.y });
                }
                while (myPath = myPath.Parent);
                // clear the working arrays
                AStar = Closed = Open = [];
                // we want to return start to finish
                result.reverse();
            }
            else // not the destination
            {
                // find which nearby nodes are walkable
                myNeighbours = Neighbours(myNode.x, myNode.y);
                // test each one that hasn't been tried already
                for(i = 0, j = myNeighbours.length; i < j; i++) {
                    myPath = Node( myNode, myNeighbours[i], width );
                    if (!AStar[myPath.value]) {
                        // estimated cost of this particular route so far
                        myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
                        // estimated cost of entire guessed route to the destination
                        myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
                        // remember this new path for testing above
                        Open.push(myPath);
                        // mark this node in the world graph as visited
                        AStar[myPath.value] = true;
                    }
                }
                // remember this route as having no more untested options
                Closed.push(myNode);
            }
        } // keep iterating until the Open list is empty
        return result;
    }

    // actually calculate the a-star path!
    // this returns an array of coordinates
    // that is empty if no path is possible
    return calculatePath();
};
export default findPath;

/* internal methods */

// distanceFunction functions
// these return how far away a point is to another

function ManhattanDistance( Point, Goal ) {
    // linear movement - no diagonals - just cardinal directions (NSEW)
    return abs( Point.x - Goal.x ) + abs( Point.y - Goal.y );
}

function DiagonalDistance( Point, Goal ) {
    // diagonal movement - assumes diag dist is 1, same as cardinals
    return max(abs( Point.x - Goal.x ), abs( Point.y - Goal.y ));
}

function EuclideanDistance( Point, Goal ) {
    // diagonals are considered a little farther than cardinal directions
    // diagonal movement using Euclide (AC = sqrt(AB^2 + BC^2))
    // where AB = x2 - x1 and BC = y2 - y1 and AC will be [x3, y3]
    return sqrt( pow( Point.x - Goal.x, 2 ) + pow( Point.y - Goal.y, 2 ));
}

// returns boolean value (world cell is available and open)
function canWalkHere( x, y, width, height ) {
    return x < width && y < height &&
           terrain[ y * width + x ] <= maxWalkableTileNum;
}

// Node function, returns a new object with Node properties
// Used in the calculatePath function to store route costs, etc.
function Node( parent, point, width ) {
    return {
        // pointer to another Node object
        parent,
        // array index of this Node in the world linear array
        value: point.x + ( point.y * width ),
        // the location coordinates of this Node
        x: point.x,
        y: point.y,
        // the heuristic estimated cost
        // of an entire path using this node
        f: 0,
        // the distanceFunction cost to get
        // from the starting point to this node
        g: 0
    };
}
