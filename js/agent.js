
class Agent {

    constructor(gameManager) {
       
    }

    selectMove() {
        var brain = new AgentBrain(gameManager);

        // Use the brain to simulate moves
        // brain.move(i) 
        // i = 0: up, 1: right, 2: down, 3: left
        // brain.reset() resets the brain to the current game board
    
        if (brain.move(0)) return 0;
        if (brain.move(1)) return 1;
        if (brain.move(3)) return 3;
        if (brain.move(2)) return 2;
    };
    
    evaluateGrid(gameManager) {
        // calculate a score for the current grid configuration
    
    };
}
