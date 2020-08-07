# rpg

NAME IDAES:

Nocturbulent
Nocturin
Nocturmoil
Nocturnopoly
Ypnopoly / ypnopolio
nykterinos

A browser based adventure game in which the player should at all costs prevent
seeing daylight. Instead the player is destined to forever live a hedonistic
lifestyle during endless summer nights, looking for ways to keep a low profile
during the day.

## Game concepts

The game is time bound and takes place in the 1980's. Each new game starts at
the same date (see _time-util.js_).

Each game is also unique in that upon creation, the world is generated uniquely
to the game's randomly generated creation hash. As such, no two games are the same.

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

While the game clock increments at a higher speed than in actual life, think of all time related
operations (e.g. _Effects_) as if they were actual time (e.g. _"the effect of this item should last for two hours in the perception of the player character"_). The unit used is the _millisecond_ and is automatically
scaled to the game/real life ratio when creating a new Effect using the EffectFactory.

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

* Show inventory on status screen
* Create pawn shop
* Create fast travel by introducing subway (can only travel to visited areas!)
* Ensure you can take stairs back to previous floor when inside a building, (last floor has no stairway up!)
* Allow to buy on credit, starts action by which you need to have repaid the person!
* Show navigation icon in interface (when showing target, but also as mouse cursor?)
* When player clicks on non-navigate-able tile, navigate as close to the tile as possible (take dominant distance on x-y coordinate and keep reducing until path is found)
* Buildings should occupy their full size on sidewalk/sand-only tiles?
* Buildings should close in the morning! (unless you have a place to sleep inside)
* Don't spawn/generate actionable object in empty tile surrounded by a closed path
* Make menu collapsable
* World must become lighter when morning comes
* Keep track of important dates (Christmas, New Year)
* When a new waypoint is set and its first tile(s) is equal to the existing waypoint, keep momentum going?
* Time should be able to speed up (when sleeping for instance)
* When drunk shuffle letters in sentences randomly =D
