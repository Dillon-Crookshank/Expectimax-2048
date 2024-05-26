//The max depth the game tree is traversed
const DEPTH = 5;

// This particular weighted sum matrix encourages the agent to snake the tile values
const EVAL_MATRIX = [
    [4096, 256, 16, 1],
    [2048, 128, 8, 0.5],
    [1024, 64, 4, 0.25],
    [512, 32, 2, 0.125]
];

class Agent {
    constructor(gameManager) {
       this.gameManager = gameManager
    }

    // Selects the best move based on the current game board
    selectMove() {
        let brain = new AgentBrain(this.gameManager);
        return this.expectimax(brain);
    };

    // Returns a weighted sum of the tile values on the board with respect to EVAL_MATRIX
    evaluateGrid(grid) {
        let sum = 0;

        grid.eachCell(function (x, y, tile) {
                if (!tile) return;

                sum += EVAL_MATRIX[x][y] * tile['value'];
            }
        );

        return sum;
    }
    
    //Given an agent brain that contains the current game board, this function should return the best move
    expectimax(brain) {
        let champ_score = null;
        let champ_move = null;
        
        // Iterate through every possible move to find the maximum utility
        for (let move = 0; move < 4; move++) {
            // Reset the brain before trying to move
            brain.reset();
            
            // Try to execute a move, continue to next loop if unable.
            if (!brain.move(move)) continue;

            // Find the value of this move by examining the resulting game tree
            let curr_score = this.expectimax_chance(brain, DEPTH);

            // Update champion variables
            if (!champ_score || champ_score < curr_score) {
                champ_score = curr_score;
                champ_move = move;
            }
        }

        // Return the best move
        return champ_move;
    }

    // Performs each possible move on the current grid and returns the maximum possible value achieved from a single move.
    expectimax_max(brain, depth) {
        // Base case - Depth Limit Reached
        if (depth === 0) 
            return this.evaluateGrid(brain.grid);
        
        // Iterate through every possible move to find the maximum utility
        let max_score = Number.MIN_SAFE_INTEGER;
        for (let move = 0; move < 4; move++) {            
            // Try to execute a move, continue if unable.
            if (!brain.move(move)) continue;

            // Find the value of this game board by examining the game tree
            max_score = Math.max(this.expectimax_chance(brain, depth-1), max_score);

            // Undo the previous move before continuing
            brain.undo();
        }

        // Base case - No Moves Possible
        if (max_score === Number.MIN_SAFE_INTEGER)
            return -1_000_000_000_000;
        
        // Return the best score
        return max_score;
    }

    // Places a tile in every possible location and returns the weighted mean of all possible values achieved
    expectimax_chance(brain, depth) {
        // Base case - Depth Limit Reached
        if (depth === 0) 
            return this.evaluateGrid(brain.grid);
        
        
        // Iterate through every possible tile placement to find the average score
        let total_score = 0;
        let tiles = brain.grid.availableCells();
        for (let index = 0; index < tiles.length; index++) {
            // Place a 2-value tile
            brain.place_tile(tiles[index], 2);

            // Find this game boards value by examining the game tree
            total_score += 0.9 * this.expectimax_max(brain, depth-1);
            
            // Undo the tile placement for the next tile
            brain.undo();


            // Place a 4-value tile
            brain.place_tile(tiles[index], 4);

            total_score += 0.1 * this.expectimax_max(brain, depth-1);
            
            // Undo the tile placement for the next tile
            brain.undo();
        }

        // Return the average score
        return total_score / (tiles.length * 2)
    }
}
