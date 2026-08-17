const recipe = (id, name, outputQuantity, ingredients, alternatives = []) => ({ id, name, outputQuantity, ingredients, alternatives });

export const DAYS_GONE_RECIPES = [
  recipe("bandage", "Bandage", 1, [["rag", 1], ["sterilizer", 1]]),
  recipe("health_cocktail", "Health Cocktail", 1, [["rag", 1], ["sterilizer", 1], ["herb", 1]]),
  recipe("stamina_cocktail", "Stamina Cocktail", 1, [["rag", 1], ["sterilizer", 1], ["berry", 1]]),
  recipe("focus_cocktail", "Focus Cocktail", 1, [["rag", 1], ["sterilizer", 1], ["mushroom", 1]]),
  recipe("molotov", "Molotov", 1, [["beer_bottle", 1], ["rag", 1], ["kerosene", 1]]),
  recipe("napalm_molotov", "Napalm Molotov", 1, [["growler", 1], ["rag", 1], ["kerosene", 1], ["polystyrene", 1]]),
  recipe("pipe_bomb", "Pipe Bomb", 1, [["small_pipe", 1], ["gun_powder", 1], ["box_of_nails", 1], ["scrap", 1]]),
  recipe("smoke_bomb", "Smoke Bomb", 1, [["can", 1], ["rag", 1], ["gun_powder", 1], ["scrap", 1]]),
  recipe("attractor", "Attractor", 1, [["can", 1], ["scrap", 1]], [["sound_device", [["alarm_clock", 1], ["car_alarm", 1]]]]),
  recipe("attractor_bomb", "Attractor Bomb", 1, [["can", 1], ["gun_powder", 1], ["spark_igniter", 1], ["scrap", 1]], [["sound_device", [["alarm_clock", 1], ["car_alarm", 1]]]]),
  recipe("remote_bomb", "Remote Bomb", 1, [["airbag", 1], ["spark_igniter", 1], ["box_of_nails", 1], ["scrap", 1]]),
  recipe("proximity_bomb", "Proximity Bomb", 1, [["can", 1], ["spark_igniter", 1], ["gun_powder", 1], ["box_of_nails", 1], ["scrap", 1]]),
  recipe("crossbow_bolt", "Crossbow Bolt", 5, [["cedar_sapling", 1], ["scrap", 1]]),
  recipe("residue_bolt", "Residue Bolt", 5, [["cedar_sapling", 1], ["nest_residue", 1], ["scrap", 1]]),
  recipe("poison_bolt", "Poison Bolt", 5, [["cedar_sapling", 1], ["poison", 1], ["scrap", 1]]),
  recipe("incendiary_bolt", "Incendiary Bolt", 3, [["cedar_sapling", 1], ["rag", 1], ["kerosene", 1], ["scrap", 1]]),
  recipe("explosive_bolt", "Explosive Bolt", 3, [["cedar_sapling", 1], ["spark_igniter", 1], ["gun_powder", 1], ["scrap", 1]]),
];

export const RESOURCE_NAMES = {
  airbag: "Airbag", alarm_clock: "Alarm Clock", beer_bottle: "Beer Bottle", berry: "Berry", box_of_nails: "Nails",
  can: "Can", car_alarm: "Car Alarm", cedar_sapling: "Cedar Sapling", growler: "Growler", gun_powder: "Gun Powder",
  herb: "Herb", kerosene: "Kerosene", mushroom: "Mushroom", nest_residue: "Nest Residue", poison: "Poison",
  polystyrene: "Polystyrene", rag: "Rag", sawblade: "Saw Blade", scrap: "Scrap", small_pipe: "Pipe",
  spark_igniter: "Spark Igniter", sterilizer: "Sterilizer",
};

const ALIASES = {
  "airbag": "airbag", "air bag": "airbag", "alarm clock": "alarm_clock", "beer bottle": "beer_bottle", bottle: "beer_bottle",
  berry: "berry", nails: "box_of_nails", "box of nails": "box_of_nails", can: "can", "car alarm": "car_alarm",
  "cedar sapling": "cedar_sapling", "collectible plant": "herb", growler: "growler", "gun powder": "gun_powder",
  herb: "herb", kerosene: "kerosene", mushroom: "mushroom", "nest residue": "nest_residue", poison: "poison",
  polystyrene: "polystyrene", rag: "rag", "saw blade": "sawblade", sawblade: "sawblade", scrap: "scrap", pipe: "small_pipe",
  "small pipe": "small_pipe", "spark igniter": "spark_igniter", sterilizer: "sterilizer", steriliser: "sterilizer",
};

export const resourceIdForName = (value) => ALIASES[String(value ?? "").trim().toLowerCase()];
export const resourceNameForId = (value) => RESOURCE_NAMES[value] ?? value;
