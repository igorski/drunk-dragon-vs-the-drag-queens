# rpg

## Game concepts

The game is time bound and takes place in the 1980's. Each new game starts at
the same date (see _time-util.js_). While the clock increments at a higher speed than
in actual life, to make things easier think of time related operations (such as _Effects_)
in _game time_, e.g. _how the character would experience it_ (e.g. _"this should last for two hours"_).
The unit used is the _millisecond_.

The game is also unique in that upon creation, the world is generated uniquely
to the game's hash. As such, no two games are the same. The generation is however
_deterministic_, as such loading a saved game restores the world as you left it.

## Game model

The game is written using Vue with Vuex.

All game's actors and properties are Object structures inside Vuex store states making
these reactive.

In order to create a new structure, a factory pattern is provided and every
game structure has its own factory (see _./src/model/factories/_). You should never
create your own Object structure but use a factory instead.

Operations on structures are done using the action modules (see _./src/model/actions/_).
A lot of structures specify their own getters as well as mutations (remember when changing values
of a Vuex state object that these should be called from a Vuex store mutation-method).

## Application source outline

 * _./assets/_ resources referenced by the application e.g. images, fonts and spritesheets
 * _./components/_ Vue components
 * _./config/_ generic configuration
 * _./definitions/_ enumerations for game specific actions
 * _./model/_ game actor factories and actions (e.g. game logic)
 * _./renderers/_ visualisers of game actors (either as zCanvas "sprites" or Vue components)
 * _./services/_ preloading / caching routines, etc.
 * _./store/_ Vuex store root and sub modules
 * _./styles/_ SASS stylesheets
 * _./utils/_ common helper methods

## Project setup
```
npm install
```

### Development

Create a local development server with hot module reload:

```
npm run dev
```

Creating a production build (build output will reside in _./dist/_-folder):

```
npm run build
```

Running unit tests:

```
npm run test
```
## TODO

* Allow to buy on credit, starts action by which you need to have repaid the person!
* Environments should not have an x, y for the player, but its Character should!
* Show navigation icon
* When player clicks on non-navigate-able tile, navigate as close to the tile as possible (take dominant distance on x-y coordinate and keep reducing until path is found)
* Building floors should have two stairs, to go up but also down! (last floor has no up, player should go back down!!)
* Buildings should occupy their full size on sidewalk/sand-only tiles?
* Sometimes building start offset is not inside walkable ground ?
* Buildings should close in the morning! (unless you have a place to sleep inside)
* Kick people out of shop after 30 game minutes have passed
* Serialize Effects into saved game (subtract elapsed and set current value as start)
* Don't spawn/generate actionable object in empty tile surrounded by a closed path
* Make menu collapsable
* World must become lighter when morning comes
* Keep track of important dates (Christmas, New Year)
* When a new waypoint is set and its first tile(s) is equal to the existing waypoint, keep momentum going?
* Time should be able to speed up (when sleeping for instance)
* When drunk shuffle letters in sentences randomly =D
* Add a timer to GameModel that runs periodic updates:

 every now and then re-generate all characters (if none is currently in the range of the player 20 tiles)
 if characters share their new position with another character, halt movement
