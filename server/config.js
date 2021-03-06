// SERVER CONFIG, neccessary to run the server
// some of these will probably become instantiated per game
// (for instance, turns till mold could default to 25 but be individually modified per-game)

config = {
	PORT: 16160,
	MAX_PLAYERS: 32,
	TICKS_PER_SECOND: 20, // doesnt really affect this game cus its turn based
	TURNS_UNTIL_MOLD: 25,
	FRIENDLY_FIRE: true
}

module.exports = config