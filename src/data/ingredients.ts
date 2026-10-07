import type { Ingredient } from '../domain/types'

/**
 * Growable things: what a UK allotment holder commonly grows. harvestMonths
 * include months eaten from store (potatoes, onions, squash, apples and so on).
 */
const GROWABLE: readonly Ingredient[] = [
  // Veg
  { id: 'tomato', name: 'Tomatoes', aisle: 'veg', growable: true, art: 'tomato', harvestMonths: [6, 7, 8, 9, 10] },
  { id: 'courgette', name: 'Courgettes', aisle: 'veg', growable: true, art: 'courgette', harvestMonths: [6, 7, 8, 9, 10] },
  { id: 'runner-bean', name: 'Runner beans', aisle: 'veg', growable: true, art: 'bean', harvestMonths: [7, 8, 9, 10] },
  { id: 'french-bean', name: 'French beans', aisle: 'veg', growable: true, art: 'bean', harvestMonths: [7, 8, 9, 10] },
  { id: 'broad-bean', name: 'Broad beans', aisle: 'veg', growable: true, art: 'broad-bean', harvestMonths: [5, 6, 7, 8] },
  { id: 'pea', name: 'Peas', aisle: 'veg', growable: true, art: 'pea', harvestMonths: [6, 7, 8, 9] },
  { id: 'potato', name: 'Potatoes', aisle: 'veg', growable: true, art: 'potato', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'onion', name: 'Onions', aisle: 'veg', growable: true, art: 'onion', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'shallot', name: 'Shallots', aisle: 'veg', growable: true, art: 'onion', harvestMonths: [1, 2, 3, 7, 8, 9, 10, 11, 12] },
  { id: 'garlic', name: 'Garlic', aisle: 'veg', growable: true, art: 'garlic', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'leek', name: 'Leeks', aisle: 'veg', growable: true, art: 'leek', harvestMonths: [1, 2, 3, 4, 9, 10, 11, 12] },
  { id: 'spring-onion', name: 'Spring onions', aisle: 'veg', growable: true, art: 'spring-onion', harvestMonths: [4, 5, 6, 7, 8, 9, 10] },
  { id: 'carrot', name: 'Carrots', aisle: 'veg', growable: true, art: 'carrot', harvestMonths: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'beetroot', name: 'Beetroot', aisle: 'veg', growable: true, art: 'beetroot', harvestMonths: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'parsnip', name: 'Parsnips', aisle: 'veg', growable: true, art: 'parsnip', harvestMonths: [1, 2, 3, 10, 11, 12] },
  { id: 'swede', name: 'Swede', aisle: 'veg', growable: true, art: 'swede', harvestMonths: [1, 2, 3, 10, 11, 12] },
  { id: 'turnip', name: 'Turnips', aisle: 'veg', growable: true, art: 'swede', harvestMonths: [1, 2, 5, 6, 7, 10, 11, 12] },
  { id: 'celeriac', name: 'Celeriac', aisle: 'veg', growable: true, art: 'celeriac', harvestMonths: [1, 2, 3, 10, 11, 12] },
  { id: 'celery', name: 'Celery', aisle: 'veg', growable: true, art: 'celery', harvestMonths: [8, 9, 10, 11] },
  { id: 'kale', name: 'Kale', aisle: 'veg', growable: true, art: 'kale', harvestMonths: [1, 2, 3, 4, 10, 11, 12] },
  { id: 'chard', name: 'Chard', aisle: 'veg', growable: true, art: 'chard', harvestMonths: [4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'spinach', name: 'Spinach', aisle: 'veg', growable: true, art: 'spinach', harvestMonths: [3, 4, 5, 6, 9, 10, 11] },
  { id: 'cabbage', name: 'Cabbage', aisle: 'veg', growable: true, art: 'cabbage', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'red-cabbage', name: 'Red cabbage', aisle: 'veg', growable: true, art: 'cabbage', harvestMonths: [1, 2, 3, 9, 10, 11, 12] },
  { id: 'cauliflower', name: 'Cauliflower', aisle: 'veg', growable: true, art: 'cauliflower', harvestMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'broccoli', name: 'Broccoli', aisle: 'veg', growable: true, art: 'broccoli', harvestMonths: [2, 3, 4, 7, 8, 9, 10] },
  { id: 'brussels-sprout', name: 'Brussels sprouts', aisle: 'veg', growable: true, art: 'brussels-sprout', harvestMonths: [1, 2, 3, 10, 11, 12] },
  { id: 'lettuce', name: 'Lettuce', aisle: 'veg', growable: true, art: 'lettuce', harvestMonths: [5, 6, 7, 8, 9, 10] },
  { id: 'rocket', name: 'Rocket', aisle: 'veg', growable: true, art: 'lettuce', harvestMonths: [4, 5, 6, 7, 8, 9, 10] },
  { id: 'salad-leaves', name: 'Salad leaves', aisle: 'veg', growable: true, art: 'lettuce', harvestMonths: [4, 5, 6, 7, 8, 9, 10, 11] },
  { id: 'radish', name: 'Radishes', aisle: 'veg', growable: true, art: 'radish', harvestMonths: [4, 5, 6, 7, 8, 9, 10] },
  { id: 'cucumber', name: 'Cucumber', aisle: 'veg', growable: true, art: 'cucumber', harvestMonths: [6, 7, 8, 9] },
  { id: 'squash', name: 'Squash', aisle: 'veg', growable: true, art: 'pumpkin', harvestMonths: [1, 2, 3, 9, 10, 11, 12] },
  { id: 'pumpkin', name: 'Pumpkin', aisle: 'veg', growable: true, art: 'pumpkin', harvestMonths: [1, 9, 10, 11, 12] },
  { id: 'sweetcorn', name: 'Sweetcorn', aisle: 'veg', growable: true, art: 'sweetcorn', harvestMonths: [8, 9] },
  { id: 'chilli', name: 'Chillies', aisle: 'veg', growable: true, art: 'chilli', harvestMonths: [7, 8, 9, 10, 11] },
  { id: 'pepper', name: 'Peppers', aisle: 'veg', growable: true, art: 'pepper', harvestMonths: [7, 8, 9, 10] },
  { id: 'aubergine', name: 'Aubergines', aisle: 'veg', growable: true, art: 'aubergine', harvestMonths: [8, 9, 10] },
  { id: 'fennel', name: 'Fennel', aisle: 'veg', growable: true, art: 'fennel', harvestMonths: [6, 7, 8, 9, 10] },
  { id: 'asparagus', name: 'Asparagus', aisle: 'veg', growable: true, art: 'asparagus', harvestMonths: [4, 5, 6] },
  { id: 'jerusalem-artichoke', name: 'Jerusalem artichokes', aisle: 'veg', growable: true, art: 'potato', harvestMonths: [1, 2, 3, 10, 11, 12] },

  // Fruit
  { id: 'rhubarb', name: 'Rhubarb', aisle: 'fruit', growable: true, art: 'rhubarb', harvestMonths: [2, 3, 4, 5, 6, 7] },
  { id: 'strawberry', name: 'Strawberries', aisle: 'fruit', growable: true, art: 'strawberry', harvestMonths: [6, 7, 8, 9] },
  { id: 'raspberry', name: 'Raspberries', aisle: 'fruit', growable: true, art: 'raspberry', harvestMonths: [6, 7, 8, 9, 10] },
  { id: 'blackberry', name: 'Blackberries', aisle: 'fruit', growable: true, art: 'blackberry', harvestMonths: [8, 9, 10] },
  { id: 'blackcurrant', name: 'Blackcurrants', aisle: 'fruit', growable: true, art: 'currant', harvestMonths: [6, 7, 8] },
  { id: 'redcurrant', name: 'Redcurrants', aisle: 'fruit', growable: true, art: 'currant', harvestMonths: [6, 7, 8] },
  { id: 'gooseberry', name: 'Gooseberries', aisle: 'fruit', growable: true, art: 'gooseberry', harvestMonths: [6, 7, 8] },
  { id: 'apple', name: 'Apples', aisle: 'fruit', growable: true, art: 'apple', harvestMonths: [1, 2, 3, 8, 9, 10, 11, 12] },
  { id: 'pear', name: 'Pears', aisle: 'fruit', growable: true, art: 'pear', harvestMonths: [8, 9, 10, 11, 12] },
  { id: 'plum', name: 'Plums', aisle: 'fruit', growable: true, art: 'plum', harvestMonths: [8, 9, 10] },

  // Herbs
  { id: 'basil', name: 'Basil', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [6, 7, 8, 9, 10] },
  { id: 'parsley', name: 'Parsley', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'mint', name: 'Mint', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [4, 5, 6, 7, 8, 9, 10] },
  { id: 'coriander', name: 'Coriander', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [5, 6, 7, 8, 9, 10] },
  { id: 'dill', name: 'Dill', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [6, 7, 8, 9] },
  { id: 'chives', name: 'Chives', aisle: 'herbs', growable: true, art: 'herb-soft', harvestMonths: [3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 'rosemary', name: 'Rosemary', aisle: 'herbs', growable: true, art: 'herb-woody', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'thyme', name: 'Thyme', aisle: 'herbs', growable: true, art: 'herb-woody', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'sage', name: 'Sage', aisle: 'herbs', growable: true, art: 'herb-woody', harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
]

/** Larder and shop items: things you buy rather than grow. */
const SHOP: readonly Ingredient[] = [
  // Oils and sauces
  { id: 'olive-oil', name: 'Olive oil', aisle: 'oils-sauces', growable: false },
  { id: 'vegetable-oil', name: 'Vegetable oil', aisle: 'oils-sauces', growable: false },
  { id: 'white-wine-vinegar', name: 'White wine vinegar', aisle: 'oils-sauces', growable: false },
  { id: 'red-wine-vinegar', name: 'Red wine vinegar', aisle: 'oils-sauces', growable: false },
  { id: 'balsamic-vinegar', name: 'Balsamic vinegar', aisle: 'oils-sauces', growable: false },
  { id: 'cider-vinegar', name: 'Cider vinegar', aisle: 'oils-sauces', growable: false },
  { id: 'malt-vinegar', name: 'Malt vinegar', aisle: 'oils-sauces', growable: false },
  { id: 'mustard', name: 'Mustard', aisle: 'oils-sauces', growable: false },
  { id: 'soy-sauce', name: 'Soy sauce', aisle: 'oils-sauces', growable: false },

  // Dairy and eggs
  { id: 'butter', name: 'Butter', aisle: 'dairy-eggs', growable: false },
  { id: 'milk', name: 'Milk', aisle: 'dairy-eggs', growable: false },
  { id: 'double-cream', name: 'Double cream', aisle: 'dairy-eggs', growable: false },
  { id: 'yoghurt', name: 'Natural yoghurt', aisle: 'dairy-eggs', growable: false },
  { id: 'creme-fraiche', name: 'Crème fraîche', aisle: 'dairy-eggs', growable: false },
  { id: 'egg', name: 'Eggs', aisle: 'dairy-eggs', growable: false },
  { id: 'cheddar', name: 'Cheddar', aisle: 'dairy-eggs', growable: false },
  { id: 'parmesan', name: 'Parmesan or veggie hard cheese', aisle: 'dairy-eggs', growable: false },
  { id: 'feta', name: 'Feta', aisle: 'dairy-eggs', growable: false },
  { id: 'mozzarella', name: 'Mozzarella', aisle: 'dairy-eggs', growable: false },
  { id: 'goats-cheese', name: "Goat's cheese", aisle: 'dairy-eggs', growable: false },
  { id: 'ricotta', name: 'Ricotta', aisle: 'dairy-eggs', growable: false },
  { id: 'halloumi', name: 'Halloumi', aisle: 'dairy-eggs', growable: false },

  // Meat and fish
  { id: 'bacon', name: 'Bacon', aisle: 'meat-fish', growable: false },
  { id: 'chorizo', name: 'Chorizo', aisle: 'meat-fish', growable: false },
  { id: 'sausages', name: 'Sausages', aisle: 'meat-fish', growable: false },
  { id: 'chicken-thighs', name: 'Chicken thighs', aisle: 'meat-fish', growable: false },
  { id: 'beef-mince', name: 'Beef mince', aisle: 'meat-fish', growable: false },
  { id: 'smoked-mackerel', name: 'Smoked mackerel', aisle: 'meat-fish', growable: false },
  { id: 'salmon', name: 'Salmon fillets', aisle: 'meat-fish', growable: false },
  { id: 'white-fish', name: 'White fish fillets', aisle: 'meat-fish', growable: false },
  { id: 'prawns', name: 'Prawns', aisle: 'meat-fish', growable: false },
  { id: 'anchovies', name: 'Anchovies', aisle: 'meat-fish', growable: false },

  // Bread and pastry
  { id: 'bread', name: 'Bread', aisle: 'bread-pastry', growable: false },
  { id: 'tortillas', name: 'Tortilla wraps', aisle: 'bread-pastry', growable: false },
  { id: 'breadcrumbs', name: 'Breadcrumbs', aisle: 'bread-pastry', growable: false },
  { id: 'puff-pastry', name: 'Puff pastry', aisle: 'bread-pastry', growable: false },
  { id: 'shortcrust-pastry', name: 'Shortcrust pastry', aisle: 'bread-pastry', growable: false },
  { id: 'filo-pastry', name: 'Filo pastry', aisle: 'bread-pastry', growable: false },

  // Dry goods
  { id: 'plain-flour', name: 'Plain flour', aisle: 'dry-goods', growable: false },
  { id: 'self-raising-flour', name: 'Self-raising flour', aisle: 'dry-goods', growable: false },
  { id: 'caster-sugar', name: 'Caster sugar', aisle: 'dry-goods', growable: false },
  { id: 'brown-sugar', name: 'Soft brown sugar', aisle: 'dry-goods', growable: false },
  { id: 'jam-sugar', name: 'Jam sugar', aisle: 'dry-goods', growable: false },
  { id: 'risotto-rice', name: 'Risotto rice', aisle: 'dry-goods', growable: false },
  { id: 'long-grain-rice', name: 'Long grain rice', aisle: 'dry-goods', growable: false },
  // One entry for every shape (spaghetti, penne and so on): put the shape in the recipe amount.
  { id: 'pasta', name: 'Pasta', aisle: 'dry-goods', growable: false },
  { id: 'rice-noodles', name: 'Rice noodles', aisle: 'dry-goods', growable: false },
  { id: 'oats', name: 'Porridge oats', aisle: 'dry-goods', growable: false },
  { id: 'red-lentils', name: 'Red lentils', aisle: 'dry-goods', growable: false },
  { id: 'green-lentils', name: 'Green or brown lentils', aisle: 'dry-goods', growable: false },
  { id: 'couscous', name: 'Couscous', aisle: 'dry-goods', growable: false },
  { id: 'bulgur', name: 'Bulgur wheat', aisle: 'dry-goods', growable: false },
  { id: 'pearl-barley', name: 'Pearl barley', aisle: 'dry-goods', growable: false },
  { id: 'pine-nuts', name: 'Pine nuts', aisle: 'dry-goods', growable: false },
  { id: 'walnuts', name: 'Walnuts', aisle: 'dry-goods', growable: false },
  { id: 'ground-almonds', name: 'Ground almonds', aisle: 'dry-goods', growable: false },
  { id: 'pumpkin-seeds', name: 'Pumpkin seeds', aisle: 'dry-goods', growable: false },
  { id: 'sultanas', name: 'Sultanas', aisle: 'dry-goods', growable: false },

  // Tins and jars
  { id: 'chopped-tomatoes', name: 'Tinned chopped tomatoes', aisle: 'tins-jars', growable: false },
  { id: 'passata', name: 'Passata', aisle: 'tins-jars', growable: false },
  { id: 'tomato-puree', name: 'Tomato puree', aisle: 'tins-jars', growable: false },
  { id: 'chickpeas', name: 'Tinned chickpeas', aisle: 'tins-jars', growable: false },
  { id: 'white-beans', name: 'Tinned white beans', aisle: 'tins-jars', growable: false },
  { id: 'kidney-beans', name: 'Tinned kidney beans', aisle: 'tins-jars', growable: false },
  { id: 'coconut-milk', name: 'Coconut milk', aisle: 'tins-jars', growable: false },
  // Also stands in for chicken stock in meat recipes: say so in the amount.
  { id: 'vegetable-stock', name: 'Vegetable stock', aisle: 'tins-jars', growable: false },
  { id: 'honey', name: 'Honey', aisle: 'tins-jars', growable: false },
  { id: 'capers', name: 'Capers', aisle: 'tins-jars', growable: false },
  { id: 'olives', name: 'Olives', aisle: 'tins-jars', growable: false },
  { id: 'tahini', name: 'Tahini', aisle: 'tins-jars', growable: false },

  // Shop fruit and veg
  { id: 'lemon', name: 'Lemons', aisle: 'fruit', growable: false },
  { id: 'lime', name: 'Limes', aisle: 'fruit', growable: false },
  { id: 'orange', name: 'Oranges', aisle: 'fruit', growable: false },
  { id: 'ginger', name: 'Fresh ginger', aisle: 'veg', growable: false },
  { id: 'mushrooms', name: 'Mushrooms', aisle: 'veg', growable: false },

  // Spices and seasoning
  { id: 'ground-cumin', name: 'Ground cumin', aisle: 'spices', growable: false },
  { id: 'ground-coriander', name: 'Ground coriander', aisle: 'spices', growable: false },
  { id: 'smoked-paprika', name: 'Smoked paprika', aisle: 'spices', growable: false },
  { id: 'chilli-flakes', name: 'Chilli flakes', aisle: 'spices', growable: false },
  { id: 'curry-powder', name: 'Curry powder', aisle: 'spices', growable: false },
  { id: 'garam-masala', name: 'Garam masala', aisle: 'spices', growable: false },
  { id: 'turmeric', name: 'Ground turmeric', aisle: 'spices', growable: false },
  { id: 'cinnamon', name: 'Ground cinnamon', aisle: 'spices', growable: false },
  { id: 'nutmeg', name: 'Nutmeg', aisle: 'spices', growable: false },
  { id: 'fennel-seed', name: 'Fennel seeds', aisle: 'spices', growable: false },
  { id: 'dried-oregano', name: 'Dried oregano', aisle: 'spices', growable: false },
  { id: 'mustard-seed', name: 'Mustard seeds', aisle: 'spices', growable: false },
  { id: 'pickling-spice', name: 'Pickling spice', aisle: 'spices', growable: false },
  { id: 'ground-ginger', name: 'Ground ginger', aisle: 'spices', growable: false },
  { id: 'bay-leaf', name: 'Bay leaves', aisle: 'spices', growable: false },
]

/** Always available. Never counted as missing and never on the Shop list. */
const ASSUMED: readonly Ingredient[] = [
  { id: 'salt', name: 'Salt', aisle: 'spices', growable: false, assumed: true },
  { id: 'black-pepper', name: 'Black pepper', aisle: 'spices', growable: false, assumed: true },
  { id: 'water', name: 'Water', aisle: 'dry-goods', growable: false, assumed: true },
]

export const INGREDIENTS: readonly Ingredient[] = [...GROWABLE, ...SHOP, ...ASSUMED]
