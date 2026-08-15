const lootLocations = [
  ["Caldera Reservoir Hiking Trail", "CASCADES", "G3"],
  ["Bear Creek Hot Springs Ambush Camp", "BELKNAP", "D1", "Ambush Camp"],
  ["Belknap Caves Ambush Camp", "BELKNAP", "F4", "Ambush Camp"],
  ["Black Crater Ambush Camp", "BELKNAP", "B4", "Ambush Camp"],
  ["Rebel Rock Cave", "BELKNAP", "B3", "Horde Site / NERO Injector"],
  ["Marion Forks Farm", "BELKNAP", "E2", "Loot Location"],
  ["Marion Forks Old Wagon Hotel", "BELKNAP", "E2", "Loot Location"],
  ["Marion Forks Tunnel NERO Checkpoint", "BELKNAP", "F2", "NERO Checkpoint"],
  ["Three Fingered Jack Refugee Camp (Deek's Pet Rock)", "BELKNAP", "C2", "NERO Checkpoint (Destroyed)"],
  ["Patjens Falls Campsite", "BELKNAP", "C2"],
  ["Belknap Caves Rest Stop", "BELKNAP", "E3"],
  ["Belknap Caves Ripper Camp", "BELKNAP", "E4"],
  ["Belknap Caves Visitor Center", "BELKNAP", "E4"],
  ["Black Crater Overlook", "BELKNAP", "C4"],
  ["Black Crater Rec Area", "BELKNAP", "B4"],
  ["Bear Creek Bridge Campsite", "BELKNAP", "C2"],
  ["Crazy Willie's Overlook", "BELKNAP", "E5"],
  ["Crazy Willies", "BELKNAP", "E4"],
  ["Iron Butte Pass Parking Lot", "BELKNAP", "C4"],
  ["Lava Arch Coffee Shack", "BELKNAP", "D3", "", "Suppressor does not respawn"],
  ["Limbo Camp", "BELKNAP", "D4"],
  ["Mackenzie Pass Historical Marker", "BELKNAP", "C4"],
  ["Marion Forks Church", "BELKNAP", "E2"],
  ["Marion Forks Family Grocery & Pharmacy", "BELKNAP", "E2"],
  ["Marion Forks Fishing Store", "BELKNAP", "E2"],
  ["Marion Forks Gas Station", "BELKNAP", "E2", "", "Hidden extra scrap in red car by propane? Needs verifying"],
  ["Marion Forks Govt Offices", "BELKNAP", "E2"],
  ["Marion Forks Hungry Jim's", "BELKNAP", "E2"],
  ["Marion Forks Library", "BELKNAP", "E2"],
  ["Marion Forks Residential", "BELKNAP", "E2", "", "Suppressor does respawn"],
  ["Old Belknap Rd Road Block", "BELKNAP", "D4?"],
  ["Old Belknap Road Rest Stop & Hillside Camp", "BELKNAP", "D4?"],
  ["Patjens Lake Radio Tower", "BELKNAP", "B2", "", "2 scrap at top of tower are stacked so it looks like 1? Needs verifying"],
  ["Patjens Lake Trail Parking", "BELKNAP", "D2"],
  ["Rick Marsdon Camp & Overlook", "BELKNAP", "C4"],
  ["Riverside Ripper Camp", "BELKNAP", "C5"],
  ["Salome Hot Springs Cabins", "BELKNAP", "C3"],
  ["Salome Hot Springs Lodge (inside)", "BELKNAP", "C3"],
  ["Sniper Overlook", "BELKNAP", "B2"],
  ["Three Fingered Jack Parking Lot", "BELKNAP", "D2"],
  ["Three Fingered Jack Viewpoint", "BELKNAP", "D3"],
  ["Wheeler's Hideout (off mission) & Bridge", "BELKNAP", "C2"],
  ["Hillside Farm (House)", "LOST LAKE", "I6"],
  ["River Flow Farms", "LOST LAKE", "I6", "", "Non-mission items listed"],
  ["River Bend Farms", "LOST LAKE", "I5", "", "Dog toy"],
  ["Sherman's Camp Overlook", "LOST LAKE", "I7"],
  ["Lucky Lad Mine (Inside)", "LOST LAKE", "I7"],
  ["Rogue Camp", "LOST LAKE", "E8"],
];

function gridPosition(grid, mapSize) {
  const [, column, row] = grid.match(/^([A-I])(\d+)/);
  return {
    x: ((column.charCodeAt(0) - 65) + 0.5) * (mapSize.width / 9),
    y: (Number(row) - 0.5) * (mapSize.height / 15),
  };
}

export function createLootMarkers(mapSize) {
  const stackCounts = new Map();

  return lootLocations.map(([title, region, grid, category = "", note = ""], index) => {
    const gridKey = grid.replace("?", "");
    const stackIndex = stackCounts.get(gridKey) ?? 0;
    stackCounts.set(gridKey, stackIndex + 1);
    const position = gridPosition(gridKey, mapSize);
    const angle = stackIndex * 2.4;
    const radius = stackIndex === 0 ? 0 : 70 + Math.floor((stackIndex - 1) / 5) * 45;

    return {
      id: `loot-${index + 1}`,
      type: "loot_location",
      title,
      region,
      grid,
      category,
      note,
      position: {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + Math.sin(angle) * radius,
      },
    };
  });
}
