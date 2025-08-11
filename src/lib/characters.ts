export interface Ability {
  id: string;
  name: string;
  type: 'attack' | 'defense';
  defenseType?: 'dodge' | 'block' | 'reflect';
  value: number;
  description: string;
}

export type Village = "Hidden Leaf"| "Hidden Sand" | "Hidden Mist" | "Hidden Cloud"

export interface Character {
  id: string;
  address?: string;
  nickname: string;
  village: Village;
  specialty: string;
  baseHealth: number;
  abilities: Ability[];
}

export const CHARACTERS: Character[] = [
  {
    "id": "hidden_leaf-fire",
    "nickname": "Blazefang",
    "village": "Hidden Leaf",
    "specialty": "Fire Style Scythe Specialist from Hidden Leaf",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_leaf-fire-atk1",
        "name": "Fire Style: Fireball Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Fire Style: Fireball Jutsu using Fire chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-fire-atk2",
        "name": "Fire Style: Phoenix Sage Fire",
        "type": "attack",
        "value": 25,
        "description": "Executes Fire Style: Phoenix Sage Fire using Fire chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-fire-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Fire chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-fire-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Fire chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-fire-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "dodge"
      },
      {
        "id": "hidden_leaf-fire-def2",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 30,
        "description": "Uses dodge technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_leaf-water",
    "nickname": "Stillmist",
    "village": "Hidden Leaf",
    "specialty": "Water Style Scythe Specialist from Hidden Leaf",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_leaf-water-atk1",
        "name": "Water Style: Water Dragon Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Water Style: Water Dragon Jutsu using Water chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-water-atk2",
        "name": "Water Style: Water Prison",
        "type": "attack",
        "value": 25,
        "description": "Executes Water Style: Water Prison using Water chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-water-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Water chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-water-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Water chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-water-def1",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 25,
        "description": "Uses dodge technique for defense",
        "defenseType": "dodge"
      },
      {
        "id": "hidden_leaf-water-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_leaf-wind",
    "nickname": "Galecut",
    "village": "Hidden Leaf",
    "specialty": "Wind Style Scythe Specialist from Hidden Leaf",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_leaf-wind-atk1",
        "name": "Wind Style: Gale Palm",
        "type": "attack",
        "value": 20,
        "description": "Executes Wind Style: Gale Palm using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-wind-atk2",
        "name": "Wind Style: Vacuum Blade",
        "type": "attack",
        "value": 25,
        "description": "Executes Wind Style: Vacuum Blade using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-wind-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-wind-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_leaf-wind-def1",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 25,
        "description": "Uses dodge technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_leaf-wind-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "dodge"
      }
    ]
  },
  {
    "id": "hidden_leaf-earth",
    "nickname": "Gravemark",
    "village": "Hidden Leaf",
    "specialty": "Earth Style Sword Specialist from Hidden Leaf",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_leaf-earth-atk1",
        "name": "Earth Style: Earth Wall",
        "type": "attack",
        "value": 20,
        "description": "Executes Earth Style: Earth Wall using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-earth-atk2",
        "name": "Earth Style: Mudslide",
        "type": "attack",
        "value": 25,
        "description": "Executes Earth Style: Mudslide using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-earth-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-earth-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-earth-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "dodge"
      },
      {
        "id": "hidden_leaf-earth-def2",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 30,
        "description": "Uses dodge technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_leaf-lightning",
    "nickname": "Boltveil",
    "village": "Hidden Leaf",
    "specialty": "Lightning Style Sword Specialist from Hidden Leaf",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_leaf-lightning-atk1",
        "name": "Lightning Style: Chidori",
        "type": "attack",
        "value": 20,
        "description": "Executes Lightning Style: Chidori using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-lightning-atk2",
        "name": "Lightning Style: Lightning Net",
        "type": "attack",
        "value": 25,
        "description": "Executes Lightning Style: Lightning Net using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-lightning-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-lightning-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_leaf-lightning-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_leaf-lightning-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_sand-fire",
    "nickname": "Cindershard",
    "village": "Hidden Sand",
    "specialty": "Fire Style Kunai Specialist from Hidden Sand",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_sand-fire-atk1",
        "name": "Fire Style: Fireball Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Fire Style: Fireball Jutsu using Fire chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-fire-atk2",
        "name": "Fire Style: Phoenix Sage Fire",
        "type": "attack",
        "value": 25,
        "description": "Executes Fire Style: Phoenix Sage Fire using Fire chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-fire-atk3",
        "name": "Kunai Flurry",
        "type": "attack",
        "value": 30,
        "description": "Executes Kunai Flurry using Fire chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-fire-atk4",
        "name": "Piercing Fang",
        "type": "attack",
        "value": 35,
        "description": "Executes Piercing Fang using Fire chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-fire-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_sand-fire-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_sand-water",
    "nickname": "Miragebite",
    "village": "Hidden Sand",
    "specialty": "Water Style Shuriken Specialist from Hidden Sand",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_sand-water-atk1",
        "name": "Water Style: Water Dragon Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Water Style: Water Dragon Jutsu using Water chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-water-atk2",
        "name": "Water Style: Water Prison",
        "type": "attack",
        "value": 25,
        "description": "Executes Water Style: Water Prison using Water chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-water-atk3",
        "name": "Demon Wind Shuriken",
        "type": "attack",
        "value": 30,
        "description": "Executes Demon Wind Shuriken using Water chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-water-atk4",
        "name": "Shadow Shuriken Barrage",
        "type": "attack",
        "value": 35,
        "description": "Executes Shadow Shuriken Barrage using Water chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-water-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_sand-water-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_sand-wind",
    "nickname": "Dustveil",
    "village": "Hidden Sand",
    "specialty": "Wind Style Shuriken Specialist from Hidden Sand",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_sand-wind-atk1",
        "name": "Wind Style: Gale Palm",
        "type": "attack",
        "value": 20,
        "description": "Executes Wind Style: Gale Palm using Wind chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-wind-atk2",
        "name": "Wind Style: Vacuum Blade",
        "type": "attack",
        "value": 25,
        "description": "Executes Wind Style: Vacuum Blade using Wind chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-wind-atk3",
        "name": "Demon Wind Shuriken",
        "type": "attack",
        "value": 30,
        "description": "Executes Demon Wind Shuriken using Wind chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-wind-atk4",
        "name": "Shadow Shuriken Barrage",
        "type": "attack",
        "value": 35,
        "description": "Executes Shadow Shuriken Barrage using Wind chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-wind-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_sand-wind-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_sand-earth",
    "nickname": "Cragthorn",
    "village": "Hidden Sand",
    "specialty": "Earth Style Kunai Specialist from Hidden Sand",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_sand-earth-atk1",
        "name": "Earth Style: Earth Wall",
        "type": "attack",
        "value": 20,
        "description": "Executes Earth Style: Earth Wall using Earth chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-earth-atk2",
        "name": "Earth Style: Mudslide",
        "type": "attack",
        "value": 25,
        "description": "Executes Earth Style: Mudslide using Earth chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-earth-atk3",
        "name": "Kunai Flurry",
        "type": "attack",
        "value": 30,
        "description": "Executes Kunai Flurry using Earth chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-earth-atk4",
        "name": "Piercing Fang",
        "type": "attack",
        "value": 35,
        "description": "Executes Piercing Fang using Earth chakra and kunai mastery"
      },
      {
        "id": "hidden_sand-earth-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_sand-earth-def2",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 30,
        "description": "Uses dodge technique for defense",
        "defenseType": "dodge"
      }
    ]
  },
  {
    "id": "hidden_sand-lightning",
    "nickname": "Shocklash",
    "village": "Hidden Sand",
    "specialty": "Lightning Style Shuriken Specialist from Hidden Sand",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_sand-lightning-atk1",
        "name": "Lightning Style: Chidori",
        "type": "attack",
        "value": 20,
        "description": "Executes Lightning Style: Chidori using Lightning chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-lightning-atk2",
        "name": "Lightning Style: Lightning Net",
        "type": "attack",
        "value": 25,
        "description": "Executes Lightning Style: Lightning Net using Lightning chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-lightning-atk3",
        "name": "Demon Wind Shuriken",
        "type": "attack",
        "value": 30,
        "description": "Executes Demon Wind Shuriken using Lightning chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-lightning-atk4",
        "name": "Shadow Shuriken Barrage",
        "type": "attack",
        "value": 35,
        "description": "Executes Shadow Shuriken Barrage using Lightning chakra and shuriken mastery"
      },
      {
        "id": "hidden_sand-lightning-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_sand-lightning-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_mist-fire",
    "nickname": "Smokejaw",
    "village": "Hidden Mist",
    "specialty": "Fire Style Shuriken Specialist from Hidden Mist",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_mist-fire-atk1",
        "name": "Fire Style: Fireball Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Fire Style: Fireball Jutsu using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_mist-fire-atk2",
        "name": "Fire Style: Phoenix Sage Fire",
        "type": "attack",
        "value": 25,
        "description": "Executes Fire Style: Phoenix Sage Fire using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_mist-fire-atk3",
        "name": "Demon Wind Shuriken",
        "type": "attack",
        "value": 30,
        "description": "Executes Demon Wind Shuriken using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_mist-fire-atk4",
        "name": "Shadow Shuriken Barrage",
        "type": "attack",
        "value": 35,
        "description": "Executes Shadow Shuriken Barrage using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_mist-fire-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_mist-fire-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_mist-water",
    "nickname": "Frostrill",
    "village": "Hidden Mist",
    "specialty": "Water Style Sword Specialist from Hidden Mist",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_mist-water-atk1",
        "name": "Water Style: Water Dragon Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Water Style: Water Dragon Jutsu using Water chakra and sword mastery"
      },
      {
        "id": "hidden_mist-water-atk2",
        "name": "Water Style: Water Prison",
        "type": "attack",
        "value": 25,
        "description": "Executes Water Style: Water Prison using Water chakra and sword mastery"
      },
      {
        "id": "hidden_mist-water-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Water chakra and sword mastery"
      },
      {
        "id": "hidden_mist-water-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Water chakra and sword mastery"
      },
      {
        "id": "hidden_mist-water-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_mist-water-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_mist-wind",
    "nickname": "Ripplecut",
    "village": "Hidden Mist",
    "specialty": "Wind Style Scythe Specialist from Hidden Mist",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_mist-wind-atk1",
        "name": "Wind Style: Gale Palm",
        "type": "attack",
        "value": 20,
        "description": "Executes Wind Style: Gale Palm using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_mist-wind-atk2",
        "name": "Wind Style: Vacuum Blade",
        "type": "attack",
        "value": 25,
        "description": "Executes Wind Style: Vacuum Blade using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_mist-wind-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_mist-wind-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_mist-wind-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_mist-wind-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_mist-earth",
    "nickname": "Mudveil",
    "village": "Hidden Mist",
    "specialty": "Earth Style Sword Specialist from Hidden Mist",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_mist-earth-atk1",
        "name": "Earth Style: Earth Wall",
        "type": "attack",
        "value": 20,
        "description": "Executes Earth Style: Earth Wall using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_mist-earth-atk2",
        "name": "Earth Style: Mudslide",
        "type": "attack",
        "value": 25,
        "description": "Executes Earth Style: Mudslide using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_mist-earth-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_mist-earth-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Earth chakra and sword mastery"
      },
      {
        "id": "hidden_mist-earth-def1",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 25,
        "description": "Uses dodge technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_mist-earth-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "dodge"
      }
    ]
  },
  {
    "id": "hidden_mist-lightning",
    "nickname": "Mistvolt",
    "village": "Hidden Mist",
    "specialty": "Lightning Style Sword Specialist from Hidden Mist",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_mist-lightning-atk1",
        "name": "Lightning Style: Chidori",
        "type": "attack",
        "value": 20,
        "description": "Executes Lightning Style: Chidori using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_mist-lightning-atk2",
        "name": "Lightning Style: Lightning Net",
        "type": "attack",
        "value": 25,
        "description": "Executes Lightning Style: Lightning Net using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_mist-lightning-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_mist-lightning-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_mist-lightning-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_mist-lightning-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_cloud-fire",
    "nickname": "Brandclap",
    "village": "Hidden Cloud",
    "specialty": "Fire Style Shuriken Specialist from Hidden Cloud",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_cloud-fire-atk1",
        "name": "Fire Style: Fireball Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Fire Style: Fireball Jutsu using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_cloud-fire-atk2",
        "name": "Fire Style: Phoenix Sage Fire",
        "type": "attack",
        "value": 25,
        "description": "Executes Fire Style: Phoenix Sage Fire using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_cloud-fire-atk3",
        "name": "Demon Wind Shuriken",
        "type": "attack",
        "value": 30,
        "description": "Executes Demon Wind Shuriken using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_cloud-fire-atk4",
        "name": "Shadow Shuriken Barrage",
        "type": "attack",
        "value": 35,
        "description": "Executes Shadow Shuriken Barrage using Fire chakra and shuriken mastery"
      },
      {
        "id": "hidden_cloud-fire-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_cloud-fire-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_cloud-water",
    "nickname": "Raindrift",
    "village": "Hidden Cloud",
    "specialty": "Water Style Kunai Specialist from Hidden Cloud",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_cloud-water-atk1",
        "name": "Water Style: Water Dragon Jutsu",
        "type": "attack",
        "value": 20,
        "description": "Executes Water Style: Water Dragon Jutsu using Water chakra and kunai mastery"
      },
      {
        "id": "hidden_cloud-water-atk2",
        "name": "Water Style: Water Prison",
        "type": "attack",
        "value": 25,
        "description": "Executes Water Style: Water Prison using Water chakra and kunai mastery"
      },
      {
        "id": "hidden_cloud-water-atk3",
        "name": "Kunai Flurry",
        "type": "attack",
        "value": 30,
        "description": "Executes Kunai Flurry using Water chakra and kunai mastery"
      },
      {
        "id": "hidden_cloud-water-atk4",
        "name": "Piercing Fang",
        "type": "attack",
        "value": 35,
        "description": "Executes Piercing Fang using Water chakra and kunai mastery"
      },
      {
        "id": "hidden_cloud-water-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_cloud-water-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_cloud-wind",
    "nickname": "Stormshade",
    "village": "Hidden Cloud",
    "specialty": "Wind Style Scythe Specialist from Hidden Cloud",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_cloud-wind-atk1",
        "name": "Wind Style: Gale Palm",
        "type": "attack",
        "value": 20,
        "description": "Executes Wind Style: Gale Palm using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-wind-atk2",
        "name": "Wind Style: Vacuum Blade",
        "type": "attack",
        "value": 25,
        "description": "Executes Wind Style: Vacuum Blade using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-wind-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-wind-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Wind chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-wind-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_cloud-wind-def2",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 30,
        "description": "Uses reflect technique for defense",
        "defenseType": "reflect"
      }
    ]
  },
  {
    "id": "hidden_cloud-earth",
    "nickname": "Stonewire",
    "village": "Hidden Cloud",
    "specialty": "Earth Style Scythe Specialist from Hidden Cloud",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_cloud-earth-atk1",
        "name": "Earth Style: Earth Wall",
        "type": "attack",
        "value": 20,
        "description": "Executes Earth Style: Earth Wall using Earth chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-earth-atk2",
        "name": "Earth Style: Mudslide",
        "type": "attack",
        "value": 25,
        "description": "Executes Earth Style: Mudslide using Earth chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-earth-atk3",
        "name": "Reaper's Sweep",
        "type": "attack",
        "value": 30,
        "description": "Executes Reaper's Sweep using Earth chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-earth-atk4",
        "name": "Deadly Arc",
        "type": "attack",
        "value": 35,
        "description": "Executes Deadly Arc using Earth chakra and scythe mastery"
      },
      {
        "id": "hidden_cloud-earth-def1",
        "name": "Stone Shield",
        "type": "defense",
        "value": 25,
        "description": "Uses block technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_cloud-earth-def2",
        "name": "Substitution Jutsu",
        "type": "defense",
        "value": 30,
        "description": "Uses dodge technique for defense",
        "defenseType": "dodge"
      }
    ]
  },
  {
    "id": "hidden_cloud-lightning",
    "nickname": "Blinkrend",
    "village": "Hidden Cloud",
    "specialty": "Lightning Style Sword Specialist from Hidden Cloud",
    "baseHealth": 200,
    "abilities": [
      {
        "id": "hidden_cloud-lightning-atk1",
        "name": "Lightning Style: Chidori",
        "type": "attack",
        "value": 20,
        "description": "Executes Lightning Style: Chidori using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_cloud-lightning-atk2",
        "name": "Lightning Style: Lightning Net",
        "type": "attack",
        "value": 25,
        "description": "Executes Lightning Style: Lightning Net using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_cloud-lightning-atk3",
        "name": "Blade Rush",
        "type": "attack",
        "value": 30,
        "description": "Executes Blade Rush using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_cloud-lightning-atk4",
        "name": "Whirlwind Slash",
        "type": "attack",
        "value": 35,
        "description": "Executes Whirlwind Slash using Lightning chakra and sword mastery"
      },
      {
        "id": "hidden_cloud-lightning-def1",
        "name": "Chakra Mirror",
        "type": "defense",
        "value": 25,
        "description": "Uses reflect technique for defense",
        "defenseType": "block"
      },
      {
        "id": "hidden_cloud-lightning-def2",
        "name": "Stone Shield",
        "type": "defense",
        "value": 30,
        "description": "Uses block technique for defense",
        "defenseType": "reflect"
      }
    ]
  }
];
