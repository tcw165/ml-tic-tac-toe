import util from 'util';

import colors from 'colors/safe';

export default class main {

  constructor() {

    /**
     * The state of 3x3 board.
     * 0 denotes none.
     * 1 denotes that player one marks the tile.
     * 2 denotes that player two marks the tile.
     */
    this.state = [0, 0, 0,
                  0, 0, 0,
                  0, 0, 0];

    /**
     * 1 denotes player one's round ('o').
     * 2 denotes player two's round ('x').
     */
    this.round = 1;

    /**
     * false denotes the game is still playing.
     * 0 denotes draw.
     * 1 denotes that player one wins.
     * 2 denotes that player two wins.
     */
    this.winner = false;
  }

  /**
   *
   */
  start() {
    for (var i = 0; i < this.state.length; ++i) {
      this.state[i] = 0;
    }
    this.round = this.round === 1 ? 2 : 1;
    this.winner = false;

    // Stochastically choose the first player.
    this.round = Math.round(1 + Math.random());

    this.print();
  }

  /**
   *
   */
  restart() {
    console.log(colors.info('>>>>> New game! :D >>>>>'));
    this.start();
  }

  /**
   *
   * @param x the x position where starts from 1.
   * @param y the y position where starts from 1.
   * @return false if the game is still going;
   *         1 if the player one wins.
   *         2 if the player two wins.
   *         3 if draw.
   */
  place(x, y) {
    var newX = x - 1;
    var newY = y - 1;

    if (newX < 0 || newY < 0) {
      throw new Error('Illegal x or y.');
    }

    var index = 3 * newY + newX;

    if (this.state[index] !== 0) {
      throw new Error(util.format('The grid (%s, %s) is already placed.', x, y));
    } else {
      this.state[index] = this.round;
      // Update the round to another player's round.
      this.round = this.round === 1 ? 2 : 1;
    }

    this.winner = this.isGameOver();
    this.print();

    return this.winner;
  }

  /**
   * @return 0 denotes the round of player one.
   *         1 denotes the round of player two.
   */
  playerRound() {
    return this.round - 1;
  }

  /**
   * @return false if the game is still going;
   *         1 if the player one wins.
   *         2 if the player two wins.
   *         3 if draw.
   */
  isGameOver() {
    var state = this.state;

    if (state[0] > 0 && state[0] === state[1] && state[1] === state[2]) {
      return state[0];
    } else if (state[3] > 0 && state[3] === state[4] && state[4] === state[5]) {
      return state[3];
    } else if (state[6] > 0 && state[6] === state[7] && state[7] === state[8]) {
      return state[6];
    } else if (state[0] > 0 && state[0] === state[3] && state[3] === state[6]) {
      return state[0];
    } else if (state[1] > 0 && state[1] === state[4] && state[4] === state[7]) {
      return state[1];
    } else if (state[2] > 0 && state[2] === state[5] && state[5] === state[8]) {
      return state[2];
    } else if (state[0] > 0 && state[0] === state[4] && state[4] === state[8]) {
      return state[0];
    } else if (state[2] > 0 && state[2] === state[4] && state[4] === state[6]) {
      return state[2];
    }

    return state.every(function(val) {
      return val !== 0;
    }) && 3;
  }

  printWinner(player) {
    return player === 1 ? 'o' : 'x';
  }

  printRound() {
    return this.round === 1 ? 'o' : 'x';
  }

  printState(i) {
    if (this.state[i] === 0) {
      return '.';
    } else if (this.state[i] === 1) {
      return 'o';
    } else {
      return 'x';
    }
  }

  /**
   *
   */
  print() {
    var state = this.state;

    console.log('');
    console.log(new Date());
    console.log(colors.verbose(' %s | %s | %s'), this.printState(0), this.printState(1), this.printState(2));
    console.log(colors.verbose('---+---+---'));
    console.log(colors.verbose(' %s | %s | %s'), this.printState(3), this.printState(4), this.printState(5));
    console.log(colors.verbose('---+---+---'));
    console.log(colors.verbose(' %s | %s | %s'), this.printState(6), this.printState(7), this.printState(8));
    console.log(colors.info('Player %s\'s round.'), this.printRound());
    console.log('');
  }

}
