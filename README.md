# Drunk Dragon vs. the Drag Queens

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

* getDamageForAttack needs to take opponent defense properties into account, e.g.: clothing can increase defense

* Drag swag/charisma == mana
** Show in status view

* Do not repeat the same sentence in conversation
* Tweak conversations, also add intent specific replies and thank yous. Don't use generics ?
* Randomize attackType for opponents

* Queens inside buildings should either be woo'd or fought (and be generated again ;)
* Place bar queens in building-factory according to same logic as drabs, ideally blocking a path

* When fighting other queens, make "vogue" an action (using drag swag)
* Generate loan shark with pay back Effect (inside DEALER shop type, creates positive debt on store)
* When buying a clothes item, discard the existing one of the same type (show confirmation)
* Different background colour for bar floors
* Move WORLD_TYPE, BUILDING_TYPE, ...TILES etc out of factories and into definitions file
* Leaving building from exit can put you somewhere completely else on the map!!
* sometimes no shop is generated on first city > needs to be clothing!! and are there enough shops elsewhere?
* Introduce new attack types at higher levels (e.g. nail slash)
* Create heavily made up eyes, massive earrings and facial hair style
* Generate objects on city roads and inside buildings similar to trees (make sure no roads are blocked!)
* Buildings (and world edges) broken in Safari (must be similar to-render-at-edges-issue)?
* Hotel/bed should be fully navigatable, not just bottom center tile
* Show building floor level
* Prevent creating double walls when generating floors (and restore skipped unit test)
* Unit tests for hourNow !== lastHour in game-module.updateGame()
* Tweak attack efficiency against drabs
* Should running away not completely reposition the opponent but keep it somewhere within the screen?
* Create cave level for extra excitement
* Implement swamp for extra excitement?
* Do not save player walk effects when saving during walk (one save game got 'stuck')
* Walking left/right on overground does weird jumps when using keyboard control?
* When vacating building/shop as effect timeout is exceeded, close active screens before showing dialog
* Animate player position on map (pulsating circle)
* Waypoint path finder should not go over exits when calculating path inside building (exists are only valid as destination tile)
* Display product capabilities in shop display
* Allow to loan money, starts action by which you need to have repaid the person OR ELSE!
* make door drags expose their intent immediately, offer option to fight them (they should be stronger by a few levels)
* replace pines with more tropical trees
* More attack types depending on item / level ? (certain levels learn new moves)
* Images for shop products
* Dynamic components need a loader
* Describe in manual how different properties of intoxication/boost affect charisma (also show this on-screen!)
* should dragon get stronger / more drunk depending on hour of night ?
* When fighting / entering building, environment coordinates are messed up?
* player-module use of dispatch( "updateCharacters" ); where do we want to do this ?
* add store to sell fake nails (increases attack)
* changes to opponent should also reflect to appropriate world.characters instance (e.g. battle after run away should not restore health of dragon!)
* Don't enter exit unless path ends at its exact coordinate
* Can we give announcement of closing time when entering building?
* Do not reposition when engaging in a battle (environmentactions.hitTest)
* Identify shop types by their exterior
* Item type elevator key to allow instant access to any floor
* Don't generate scenery (trees) in front of doors!
* Bug: When navigating by the world edge, tiles on the opposite end are also marked as visited
* Create fast travel by introducing subway (can only travel to visited areas!)
* Overworld must become lighter when morning comes
* Keep track of important dates (Christmas, New Year)
* Fix popup of objects at screen edge

* world-renderer isValidTarget|maxWalkableTile|and pre calc of waypoints is duplicating environment-actions unnecessarily!
* if you are feeling brave you can start using the unused tiles in the floor sheet in environment-bitmap-cacher for the corner types
* setIntoxication should be generic update character effect (so it works with any character, not just player)?
* Should we rename World-factory > Overground-factory ?? world.vue > map.vue ?
* Code duplication between overground- and building-renderer.renderObjects
* Character-actions doesn't actually commit mutations, is more of a utility or factory...
* Short fade out of current track when starting next playback
