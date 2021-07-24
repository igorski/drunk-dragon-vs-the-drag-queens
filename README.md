# Drunk Dragon vs. the Drag Queens

NAME IDEAS:

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

All the game's actors and properties are Object structures inside Vuex store states making
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

All of the games behaviour and time bound effects update in the same place: the _updateGame()_-handler
in the _game-module_. This is bound to the render cycle of the game world (and deferred to animationFrame
so the game is effectively paused when the browser/tab isn't focused).

## Application source outline

 * _./assets/_ resources referenced by the application e.g. images, fonts and spritesheets
 * _./components/_ Vue components
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

* getDamageForAttack needs to take character attack and opponent defense into account
** Clothing can increase defense, jewelry swag

* Drag swag/charisma == mana
** Show in status view

* show XP, cash and level stats on game over screen
* don't allow navigation over walls when inside a building (max walkable tile for environment in environment-actions!)
* Create unique sprite for hotel counter
* Queens inside buildings should either be woo'd or fought
* When generating door queens, ensure hotel is actually placed successfully!
* When buying a clothes item, discard the existing one of the same type (show confirmation)
* Add a base price to certain items (e.g. clothes shouldn't be too cheap, yo. heels are an expensive item).
* Display product capabilities in shop display
* Allow to loan money, starts action by which you need to have repaid the person OR ELSE!
* status screen implement handleInventoryClick for liquor types (also see item-actions)
* make door drags expose their intent immediately, offer option to fight them (they should be stronger by a few levels)
* stop character movement effects when screen isn't game_screen (time should keep running though!)
* replace pines with more tropical trees
* More attack types depending on item / level ? (certain levels learn new moves)
* Images for shop products
* Dynamic components need a loader
* When drunk, characters should slur all 's' words
* When drunk, attacks should occasionally miss!
* Create start screen when no game is saved, show intro
* Describe in manual how different properties of intoxication/boost affect charisma (also show this on-screen!)
* should dragon get stronger / more drunk depending on hour of night ?
* When fighting / entering building, environment coordinates are messed up?
* Update level of dragon too when defeated on fight end (and relocate on map)
* player-module use of dispatch( "updateCharacters" ); where do we want to do this ?
* on game over, when there is a save offer to restore from last save
* halt all character updates when switching environments/screen isn't game_screen
* implement ambush (enemy attacks first)
* add store to sell shoes / fake nails (increases attack, certain shoes increase speed, but decrease drag swag/charisma)
* add hamburger joint (can increase hp slowly but cheaply, medicine is more expensive but more potent)
* changes to opponent should also reflect to appropriate world.characters instance (e.g. battle after run away should not restore health of dragon!)
* replace all Math.random() with random-util.random()
* Implement ambush in battle
* Implement run away (uses boost/intoxication for outcome)
* There is only a single dragon throughout the game, it should path find you in the overworld and fight you, winning the fight resets the dragon to a far side of the map
* When fighting other queens, make "flirt" an action (using drag swag)
* Don't enter exit unless path ends at its exact coordinate
* Can we give announcement of closing time when entering building?
* Create floors that are bars chockfull of people!
* Weird bug where leaving a building sets you in the middle of nowhere?? (most likely env x,y is updated for overground, not last floor)
* Identify shop types by their exterior
* Item type elevator key to allow instant access to any floor
* Intro text when starting a new game
* Don't generate scenery (trees) in front of doors!
* Bug: When navigating by the world edge, tiles on the opposite end are also marked as visited
* Create fast travel by introducing subway (can only travel to visited areas!)
* Show navigation icon in interface (when showing target, but also as mouse cursor?)
* When player clicks on non-navigate-able tile, navigate as close to the tile as possible (take dominant distance on x-y coordinate and keep reducing until path is found)
* Buildings should occupy their full size on sidewalk/sand-only tiles?
* Don't spawn/generate actionable object in empty tile surrounded by a closed path
* Overworld must become lighter when morning comes
* Keep track of important dates (Christmas, New Year)
* Time should be able to speed up (when sleeping for instance)
* world-renderer isValidTarget|maxWalkableTile|and pre calc of waypoints is duplicating environment-actions unnecessarily!
