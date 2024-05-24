
// The weights applied to all the evaluation metrics
const WEIGHTED_SUM = 1//0.2;
const MAX_TILE = 0//0.1;
const SMOOTHNESS = 0//0.1;
const MONOTONICITY = 0//0.3;
const EMPTY_TILES = 0//0.3;

//The max depth the game tree is traversed
const DEPTH = 3;

// Used in weighted sum
const EVAL_MATRIX = [
    [4, 3, 2, 1],
    [3, 2, 1, 0.5],
    [2, 1, 0.5, 0.25],
    [1, 0.5, 0.25, 0.125]
];


class Agent {

    constructor(gameManager) {
       this.gameManager = gameManager
    }

    selectMove() {
        let brain = new AgentBrain(this.gameManager);

        return this.expectimax(brain);

    };

    evaluateGrid(grid) {
        let score = 0;
        score += WEIGHTED_SUM * this.weighted_sum(grid);
        score += MAX_TILE * this.max_tile(grid);
        score += SMOOTHNESS * this.smoothness(grid);
        score += MONOTONICITY * this.monotonicity(grid);
        score += EMPTY_TILES * this.empty_tiles(grid);
        
        return score;
    }
    
    // Calulates the weighted sum of all the tiles with respect to the EVAL_MATRIX
    weighted_sum(grid) {    
        let sum = 0;
        grid.eachCell(function (x, y, tile) {
                if (!tile) return;

                sum += EVAL_MATRIX[x][y] * tile['value'];
            }
        );

        return sum;
    };

    // Returns the maximum tile value
    max_tile(grid) {
        let max = 0;
        grid.eachCell(function (x, y, tile) {
            if (!tile) return;

            max = Math.max(max, tile['value'])
        })
    }

    // Returns how 'smooth' the grid is
    smoothness(grid) {
        //grid.cells[x][y]['value']
        
        let smoothnessScore = 0;
        grid.eachCell((x, y, tile) => {
            if (!tile) return;
            
            let value = tile['value'];
            // Compare with right neighbor
            if (x < 3) {
                let rightTile = grid.cells[x][y];
                if (rightTile) {
                    smoothnessScore -= Math.abs(value - rightTile['value']);
                }
            }
            // Compare with bottom neighbor
            if (y < 3) {
                let bottomTile = grid.cells[x][y];
                if (bottomTile) {
                    smoothnessScore -= Math.abs(value - bottomTile['value']);
                }
            }
        });
        return smoothnessScore;
    }

    //
    monotonicity(grid) {
        //grid.cells[x][y]['value']

        let monotonicityScore = 0;
        // Check rows
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 3; x++) {
                let current = grid.cells[x][y];
                let next = grid.cells[x][y];
                if (current && next && current['value'] > next['value']) {
                    monotonicityScore++;
                }
            }
        }
        // Check columns
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 3; y++) {
                let current = grid.cells[x][y];
                let next = grid.cells[x][y];
                if (current && next && current['value'] > next['value']) {
                    monotonicityScore++;
                }
            }
        }
        return monotonicityScore;
    }

    // The more empty tiles the better
    empty_tiles(grid) {
        let emptyCount = 0;
        grid.eachCell((x, y, tile) => {
            if (!tile) {
                emptyCount++;
            }
        });
        return emptyCount;
    }



    //Given an agent brain that contains the current game board, this method should return the best move
    expectimax(brain) {
        // Save a restore point of the brain before we start executing moves
        let prev_brain = brain.clone();

        let champ_score = null;
        let champ_move = null;
        
        // Iterate through every possible move to find the maximum utility
        for (let move = 0; move < 4; move++) {
            // Try to execute a move, continue if unable.
            if (!brain.move(move)) continue;

            let curr_score = this.expectimax_chance(brain.clone(), DEPTH);

            // Update champion variables
            if (champ_score === null || champ_score < curr_score) {
                champ_score = curr_score;
                champ_move = move;
            }

            // Restore brain to before the move was executed
            brain = prev_brain.clone();

        }

        // Return the best move
        return champ_move;
    }

    expectimax_max(brain, depth) {
        if (depth === 0) {
            return this.evaluateGrid(brain.grid);
        }
        
        // Save a restore point of the brain before we start executing moves
        let prev_brain = brain.clone();

        let champ_score = null;
        
        // Iterate through every possible move to find the maximum utility
        for (let move = 0; move < 4; move++) {
            // Try to execute a move, continue if unable.
            if (!brain.move(move)) continue;

            let curr_score = this.expectimax_chance(brain.clone(), depth);

            // Update champion variables
            if (champ_score === null || champ_score < curr_score) {
                champ_score = curr_score;
            }

            // Restore brain to before the move was executed
            brain = prev_brain.clone();

        }

        // Return a very low score if no move was valid (player lost)
        if (champ_score === null) {
            return -100000;
        }

        // Return the maximum score
        return champ_score;
    }


    expectimax_chance(brain, depth) {
        // Save a restore point of the brain before we start placing tiles
        let prev_brain = brain.clone()

        let avg_score = 0;

        // Case where theres no room for tiles but a move may be possible
        if (brain.num_available_tiles() === 0) {
            return this.expectimax_max(brain.clone(), depth-1)
        }
        
        // Iterate though every possible tile placement to find the average utility
        for (let tile = 0; tile < brain.num_available_tiles(); tile++) {
            // Place a 2-value tile
            brain.add_available_tile(tile, 2);
            avg_score += 0.9 * this.expectimax_max(brain.clone(), depth-1);
            
            // Restore brain to before the tile was placed
            brain = prev_brain.clone();

            // Place a 4-value tile
            brain.add_available_tile(tile, 4);
            avg_score += 0.9 * this.expectimax_max(brain.clone(), depth-1);
            
            // Restore brain to before the tile was placed
            brain = prev_brain.clone();
        }

        // Find the average score
        avg_score /= brain.num_available_tiles();

        return avg_score;
    }
}
