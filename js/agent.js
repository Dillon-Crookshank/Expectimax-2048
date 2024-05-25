
// The weights applied to all the evaluation metrics
const WEIGHTED_SUM = 10
const MAX_TILE = 100
const SMOOTHNESS = 0
const MONOTONICITY = 0
const EMPTY_TILES = 50
const SNAKE = 0

//The max depth the game tree is traversed
const DEPTH = 5;

// Used in weighted sum
/*
const EVAL_MATRIX = [
    [1000, 1, -10, -1000],
    [1000, 1, -10, -1000],
    [1000, 1, -10, -1000],
    [1000, 1, -10, -1000]
];
*/

const EVAL_MATRIX = [
    [1000, 100, 10, 1],
    [100, 10, 1, -10],
    [10, 1, -10, -100],
    [1, -10, -100, -1000]
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
        let score = [];
        score.push(WEIGHTED_SUM * this.weighted_sum(grid));
        score.push(MAX_TILE * this.max_tile(grid));
        score.push(SMOOTHNESS * this.smoothness(grid));
        score.push(MONOTONICITY * this.monotonicity(grid));
        score.push(EMPTY_TILES * this.empty_tiles(grid));
        //score.push(SNAKE * this.snake(grid));

        //console.log(score);
        
        return score.reduce((acc, curr) => acc + curr, 0);
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

    // Returns the maximum tile value, returns a really high number if 
    max_tile(grid) {
        let max = 0;
        grid.eachCell(function (x, y, tile) {
            if (!tile) return;

            max = Math.max(max, tile['value'])

            if (max > 2048) {
                max = 1_000_000_000;
            }
        })

        return max;
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

    mergeability(grid) {
        
    }

    snake(grid) {
        //grid.cells[x][y]['value']
        
        //Iterate through the grid in a snake shape
        let snake_score = 0;

        let prev_value = -1;
        for (let n = 0; n < 16; n++) {
            
            let y = Math.floor(n / 4);

            let x = undefined;
            if (y % 2 == 0) {
                x = n % 4;
            } else {
                x = 3 - (n % 4);
            }

            if (!grid.cells[x][y]) {
                break;
            }

            if (n !== 0 && grid.cells[x][y]['value'] == prev_value) {
                snake_score += 1;
                prev_value = grid.cells[x][y]['value']
            }
        }

        return snake_score;
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
                let rightTile = grid.cells[x+1][y];
                if (rightTile) {
                    smoothnessScore -= Math.abs(value - rightTile['value']);
                }
            }
            // Compare with bottom neighbor
            if (y < 3) {
                let bottomTile = grid.cells[x][y+1];
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
                let next = grid.cells[x+1][y];
                if (current && next && current['value'] > next['value']) {
                    monotonicityScore++;
                }
            }
        }
        // Check columns
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 3; y++) {
                let current = grid.cells[x][y];
                let next = grid.cells[x][y+1];
                if (current && next && current['value'] > next['value']) {
                    monotonicityScore++;
                }
            }
        }
        return monotonicityScore;
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
        let move_found = false;
        
        // Iterate through every possible move to find the maximum utility
        for (let move = 0; move < 4; move++) {
            // Try to execute a move, continue if unable.
            if (!brain.move(move)) continue;

            let curr_score = this.expectimax_chance(brain.clone(), depth-1);

            // Update champion variables
            if (champ_score === null || champ_score < curr_score) {
                champ_score = curr_score;
                move_found = true;
            }

            // Restore brain to before the move was executed
            brain = prev_brain.clone();

        }

        // Return a very low score if no move was valid (player lost)
        if (!move_found) {
            console.log("found tree node")
            return -1_000_000_000;
        }

        // Return the maximum score
        return champ_score;
    }


    expectimax_chance(brain, depth) {
        if (depth === 0) {
            return this.evaluateGrid(brain.grid);
        }
        
        // Save a restore point of the brain before we start placing tiles
        let prev_brain = brain.clone()

        let avg_score = 0;

        // Case where theres no room for tiles but a move may be possible
        if (brain.num_available_tiles() === 0) {
            //console.log("Cannot place tile")
            return this.expectimax_max(brain, depth-1)
        }
        
        // Iterate though every possible tile placement to find the average utility
        for (let tile = 0; tile < brain.num_available_tiles(); tile++) {
            let t = brain.num_available_tiles()
            // Place a 2-value tile
            brain.add_available_tile(tile, 2);
            avg_score += 0.9 * this.expectimax_max(brain.clone(), depth-1);
            
            // Restore brain to before the tile was placed
            brain = prev_brain.clone();
            t = brain.num_available_tiles() - t
            if (t !== 0) console.log(`Inconsistency`)

            // Place a 4-value tile
            brain.add_available_tile(tile, 4);
            avg_score += 0.1 * this.expectimax_max(brain.clone(), depth-1);
            
            // Restore brain to before the tile was placed
            brain = prev_brain.clone();
        }

        // Find the average score
        avg_score /= brain.num_available_tiles();

        return avg_score;
    }
}
