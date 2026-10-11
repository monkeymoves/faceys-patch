import type { CropGuide } from '../domain/types'

/**
 * When to sow and plant each growable crop in the UK, with a few plain tips.
 * One guide per growable ingredient, in the same order as ingredients.ts.
 *
 * Months (1 = January) are broad windows for the middle of the country: an
 * outdoor allotment plus a windowsill or small unheated greenhouse. Northern
 * plots often run two to three weeks later. Checked against the RHS Grow Your
 * Own guides, Garden Organic growing guides, BBC Gardeners' World Magazine grow
 * guides, Charles Dowding's sowing timeline and the Real Seeds monthly sowing
 * guide, plus Kings Seeds for red cabbage.
 */
export const CROP_GUIDES: readonly CropGuide[] = [
  // Veg
  {
    ingredientId: 'tomato',
    sowIndoors: [2, 3, 4],
    plantOut: [5, 6],
    tips: [
      'Sow on a warm windowsill or in a propagator, then move each seedling into its own pot once it has two true leaves.',
      'Plant out after the last frost in your warmest, sunniest spot, burying the stem up to the first leaves so it roots along its length.',
      'Water regularly and evenly: dry spells followed by soakings split the fruit and cause blossom end rot. Feed with tomato feed once the first fruits swell.',
      'Pinch out side shoots on cordon types. Outdoors, blight is the big risk in warm, wet summers: remove blotched leaves at once.',
    ],
  },
  {
    ingredientId: 'courgette',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow one seed per pot on its edge, 2cm deep, and plant out after the last frost with a metre each way.',
      'Water at the base, not over the leaves, to keep powdery mildew off.',
      'Pick them small and often: leave one to grow into a marrow and the plant slows right down.',
      'Slugs love young plants, so check on them after dark for the first few weeks.',
    ],
  },
  {
    ingredientId: 'runner-bean',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6, 7],
    plantOut: [5, 6],
    tips: [
      'Put up a sturdy wigwam or double row of 2.5m canes first, then set one plant, or two seeds 5cm deep, at the foot of each cane.',
      'Frost kills them, so wait until late May to plant out or sow outside, and guard young plants from slugs.',
      'Water generously once they flower, as dry roots make the flowers drop without setting pods.',
      'Pick every two or three days while the pods are about 20cm long and still snap. Leave old pods on and the plants stop.',
    ],
  },
  {
    ingredientId: 'french-bean',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6, 7],
    plantOut: [5, 6],
    tips: [
      'Sow 5cm deep once the soil has warmed. Grow dwarf types 15cm apart in a block so they hold each other up.',
      'Climbing types need canes or netting like runner beans, and crop for longer.',
      'Keep slugs off the seedlings and water well in dry spells once they flower.',
      'Pick pods at 15 to 20cm, before the beans show through, and keep picking to keep them coming.',
    ],
  },
  {
    ingredientId: 'broad-bean',
    sowIndoors: [2, 3],
    sowOutdoors: [2, 3, 4, 10, 11],
    plantOut: [3, 4],
    tips: [
      'Sow 5cm deep and 20cm apart in double rows. Autumn sowings need a hardy variety such as Aquadulce Claudia and well-drained soil.',
      'Mice dig up the seed, so start them in pots under cover if that happens on your plot.',
      'Pinch out the tips once the first pods form: it puts off blackfly, and the tips are lovely steamed.',
      'Pick while the beans are small and the scar on each bean is still white or green, not black.',
    ],
  },
  {
    ingredientId: 'pea',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5, 6],
    plantOut: [3, 4],
    tips: [
      'Sow 5cm deep and 7.5cm apart in a wide, flat drill, or in a length of guttering under cover to slide into a trench later.',
      'Put up netting or twiggy pea sticks as soon as they come up, and cover early sowings against mice and pigeons.',
      'Give them a good soak when they start to flower and again two weeks later to swell the pods.',
      'Pick often: once pods are left to ripen, the plants stop flowering.',
    ],
  },
  {
    ingredientId: 'potato',
    plantOut: [3, 4, 5],
    tips: [
      'Chit seed potatoes on a cool, light windowsill from February so they have short, sturdy shoots by planting time.',
      'Plant 15cm deep: earlies 30cm apart in rows 60cm apart, maincrops 37cm apart in rows 75cm apart.',
      'Earth up the stems as they grow, to keep light off the tubers and late frost off the shoots.',
      'Lift earlies when the flowers open. If blight browns the leaves of maincrops, cut the tops off and lift the tubers two weeks later.',
    ],
  },
  {
    ingredientId: 'onion',
    sowIndoors: [1, 2, 3],
    sowOutdoors: [3, 4],
    plantOut: [3, 4, 9, 10],
    tips: [
      'Plant sets 10cm apart with just the tip showing, in rows 25 to 30cm apart. Net or fleece them until they root, as birds pull them up.',
      'From seed, sow three or four seeds per module on a windowsill and plant out the clumps whole in spring.',
      'Weed well and water in dry spells early on, but stop once the bulbs swell in midsummer so they store better.',
      'Lift when the leaves yellow and topple, then dry them in the sun before storing.',
    ],
  },
  {
    ingredientId: 'shallot',
    plantOut: [2, 3, 4, 10, 11],
    tips: [
      'Plant sets 15 to 20cm apart with the tip just showing, in rows 25 to 30cm apart. Each one grows into a cluster of bulbs.',
      'Autumn planting gives earlier, heavier crops, but skip it on heavy, wet soil where sets rot over winter.',
      'Birds pull up new sets, so net them until they root and push back any that get lifted.',
      'Lift in mid to late summer when the leaves yellow and flop, then dry them well before storing.',
    ],
  },
  {
    ingredientId: 'garlic',
    plantOut: [2, 3, 10, 11],
    tips: [
      'Plant cloves pointed end up, 15cm apart with the tip 2.5cm below the surface, in rows 30cm apart.',
      'Autumn planting gives the biggest bulbs, as garlic needs a month or two of cold. Choose a spring variety for February and March.',
      'On heavy, wet soil, start cloves in modules in a cold frame and plant them out in spring.',
      'Lift when the leaves turn yellow and dry the bulbs in the sun. Snap off any flower stems and cook them.',
    ],
  },
  {
    ingredientId: 'leek',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5],
    plantOut: [4, 5, 6, 7],
    tips: [
      'Sow thinly in modules or a seedbed and move them on at about 20cm tall and pencil thick.',
      'Drop each one into a dibber hole 15cm deep, 15cm apart in rows 30cm apart, and fill the hole with water, not soil.',
      'Leek moth and allium leaf miner can ruin a crop, so cover with fine insect mesh if they are about on your site.',
      'Lift as you need them from late summer. Hardy late varieties stand all winter.',
    ],
  },
  {
    ingredientId: 'spring-onion',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5, 6, 7, 8, 9],
    plantOut: [3, 4, 5],
    tips: [
      'Sow thinly in drills 1cm deep, rows 20cm apart, a short row every two or three weeks for a steady supply.',
      'Or sow a pinch of seed per module and plant out the little clumps whole.',
      'Hardy varieties sown in late summer give the first pickings the following spring.',
      'Pull them young, about 15cm tall, while they are sweet and mild.',
    ],
  },
  {
    ingredientId: 'carrot',
    sowOutdoors: [3, 4, 5, 6, 7],
    tips: [
      'Sow thinly in drills 1cm deep, rows 15 to 30cm apart, and thin to 5cm. Stony or freshly manured ground gives forked roots.',
      'Carrot fly is drawn by the smell of bruised leaves, so cover the row with fine insect mesh from sowing.',
      'They are slow to come up, so keep the drill damp and be patient. Sow a short row every three or four weeks.',
      'Give them a good soak every fortnight in long dry spells, as dry then wet makes the roots split.',
    ],
  },
  {
    ingredientId: 'beetroot',
    sowIndoors: [3, 4],
    sowOutdoors: [3, 4, 5, 6, 7],
    plantOut: [4, 5],
    tips: [
      'Each knobbly seed is a cluster, so sow 2.5cm deep and 10cm apart, in rows 30cm apart, and thin to the strongest seedling.',
      'For an early crop, sow two or three seeds per module under cover and plant out each clump without splitting it.',
      'Pick a bolt resistant variety for early sowings, and sow a short row every few weeks.',
      'Pull them between golf ball and cricket ball size. The young leaves cook like spinach.',
    ],
  },
  {
    ingredientId: 'parsnip',
    sowOutdoors: [3, 4, 5],
    tips: [
      'Wait for the soil to warm in spring: cold, wet ground is why parsnips fail to come up. Buy fresh seed every year.',
      'Sow three seeds every 15cm, 1cm deep, in rows 30cm apart, and thin to the strongest. Radishes in the same drill mark the row.',
      'Clear stones and skip fresh manure, or the roots fork. Fine mesh keeps carrot fly off.',
      'Lift from autumn onwards. A hard frost sweetens them, and they stand in the ground all winter.',
    ],
  },
  {
    ingredientId: 'swede',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow thinly 2cm deep in rows about 40cm apart and thin to 20 to 25cm. Modules under cover help if slugs are bad.',
      'They are brassicas, so grow them with the cabbages in your rotation and cover with fine mesh against flea beetle.',
      'Keep them watered in dry spells, or the roots split or turn bitter and the leaves get powdery mildew.',
      'Lift from autumn when 10 to 15cm across. They stand in the ground into winter, or store in boxes of sand.',
    ],
  },
  {
    ingredientId: 'turnip',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5, 6, 7, 8],
    plantOut: [3, 4],
    tips: [
      'Sow thinly 1cm deep in rows 23 to 30cm apart. Thin to 15cm for early types and 23cm for maincrops.',
      'Water in dry weather, or the roots stay small and woody and the plants bolt.',
      'Pull early types at golf ball size, about six weeks after sowing. Past tennis ball size they turn woody.',
      'The young tops cook like spinach, so the thinnings are not wasted.',
    ],
  },
  {
    ingredientId: 'celeriac',
    sowIndoors: [3, 4],
    plantOut: [5, 6],
    tips: [
      'It needs a long season, so sow in March on a warm windowsill, barely covering the tiny seed. It can take three weeks to come up.',
      'Keep seedlings above 10°C, then plant out after the last frost, 30cm apart, with the crown sitting on the surface.',
      'It loves moisture: a dry spell means small, woody roots. Mulch well and water deeply.',
      'Pull off the lower leaves in late summer to expose the bulb, then lift as needed through winter.',
    ],
  },
  {
    ingredientId: 'celery',
    sowIndoors: [3, 4],
    plantOut: [5, 6],
    tips: [
      'Sow on the surface in March or early April, as the seed needs light, and keep seedlings above 10°C or they may bolt later.',
      'Plant out after the last frost in a block, 23cm apart each way, so the plants shade and blanch each other.',
      'Never let it go dry, or the stems turn stringy and bitter. Slugs are the main pest.',
      'Wear gloves when handling it, as the sap can bring some people out in a rash.',
    ],
  },
  {
    ingredientId: 'kale',
    sowIndoors: [3, 4, 5],
    sowOutdoors: [3, 4, 5, 6],
    plantOut: [5, 6, 7],
    tips: [
      'Sow in modules or a seedbed and plant out at 10 to 15cm tall, deep and firm, with the lowest leaves at soil level.',
      'Give big varieties 45 to 60cm each way, as good air flow keeps disease down.',
      'Net from planting against pigeons and cabbage white caterpillars.',
      'Pick a few lower leaves from each plant at a time from autumn to spring. Frost sweetens them.',
    ],
  },
  {
    ingredientId: 'chard',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5, 6, 7],
    plantOut: [4, 5],
    tips: [
      'Sow the big seeds 2.5cm deep and 10cm apart, then thin to 30cm. Use the thinnings as baby leaves.',
      'An April sowing crops all summer, and a July sowing carries on through winter into spring.',
      'Pick the outer leaves right at the base and leave the middle to keep growing.',
      'Cut off flower stems as they appear. Once it bolts in earnest, compost it.',
    ],
  },
  {
    ingredientId: 'spinach',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5, 8, 9],
    plantOut: [3, 4],
    tips: [
      'Spinach likes cool weather: sow in spring and again in late summer, as summer heat makes it bolt.',
      'Sow thinly 2.5cm deep in rows 20cm apart and thin to 15cm, so air moves and downy mildew stays away.',
      'Water in dry spells and choose light shade for summer sowings. Use hardy varieties for winter pickings.',
      'Pick the outer leaves young and often.',
    ],
  },
  {
    ingredientId: 'cabbage',
    sowIndoors: [2, 3],
    sowOutdoors: [3, 4, 5, 6, 7, 8],
    plantOut: [4, 5, 6, 7, 8, 9, 10],
    tips: [
      'Sow summer cabbages from late winter, autumn and winter ones from April to June, and spring cabbages in July or August.',
      'Plant out at 10 to 15cm tall, deep and very firm, 30cm apart for small types and up to 45cm for big ones.',
      'Cover with fine mesh or netting from planting day against cabbage white caterpillars and pigeons.',
      'Water in dry spells as the heads form, and move brassicas round the plot each year to keep club root at bay.',
    ],
  },
  {
    ingredientId: 'red-cabbage',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5],
    plantOut: [5, 6],
    tips: [
      'Sow in modules in spring and plant out at 10 to 15cm tall, deep and firm, 35 to 45cm apart.',
      'Net against cabbage white caterpillars and pigeons, and water in dry spells so the heads swell evenly.',
      'Cut the heads in autumn once they feel firm and heavy. They keep for weeks somewhere cool and frost-free.',
    ],
  },
  {
    ingredientId: 'cauliflower',
    sowIndoors: [2, 3, 4],
    sowOutdoors: [4, 5, 6],
    plantOut: [4, 5, 6, 7],
    tips: [
      'Sow in modules and plant out at about six weeks old: 45 to 60cm apart for summer types, 70cm for winter ones.',
      'They sulk if the roots dry out or get disturbed, so water well before and after moving and plant firmly.',
      'Fold a few leaves over the head to keep it white and shield it from frost.',
      'Cut as soon as the head is firm, before it loosens. Net against pigeons and caterpillars.',
    ],
  },
  {
    ingredientId: 'broccoli',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5, 6],
    plantOut: [5, 6, 7],
    tips: [
      'Two crops in one: calabrese sown in spring heads up in summer, and sprouting broccoli sown in April or May crops from February to April.',
      'Plant deep and firm: 60cm apart for sprouting types, 30 to 45cm for calabrese. Calabrese sulks if moved in hot weather.',
      'Net against pigeons and caterpillars, and stake tall sprouting plants before the winter winds.',
      'Keep cutting the spears before the flowers open, and more side shoots follow.',
    ],
  },
  {
    ingredientId: 'brussels-sprout',
    sowIndoors: [2, 3, 4],
    sowOutdoors: [3, 4],
    plantOut: [5, 6],
    tips: [
      'They need a long season: sow in early spring and plant out in early summer, 60cm apart each way.',
      'Plant very firmly and stake them in autumn, as rocking roots give loose, open sprouts.',
      'Net against pigeons and caterpillars, and water in dry spells.',
      'Pick from the bottom of the stem up, after a frost or two has sweetened them.',
    ],
  },
  {
    ingredientId: 'lettuce',
    sowIndoors: [2, 3, 4],
    sowOutdoors: [3, 4, 5, 6, 7, 8],
    plantOut: [3, 4, 5, 6],
    tips: [
      'Sow a short row or a few modules every two or three weeks for a steady supply rather than one glut.',
      'In hot weather sow in the evening and water with cold water, as many lettuces will not germinate when it is too warm.',
      'Plant hearting types 30cm apart and loose leaf types 15cm apart, and keep the slugs off.',
      'Water in dry spells to stop them bolting. Pick loose leaf types a few leaves at a time.',
    ],
  },
  {
    ingredientId: 'rocket',
    sowIndoors: [2, 3],
    sowOutdoors: [4, 5, 6, 7, 8, 9],
    plantOut: [4, 5],
    tips: [
      'Sow thinly 1cm deep in short rows 15cm apart, a little every few weeks, and thin to 15cm.',
      'Spring and late summer sowings do best. In hot, dry spells it bolts fast, so keep it watered and give it light shade.',
      'Flea beetles pepper the leaves with tiny holes. Fine mesh keeps them off.',
      'Pick the leaves young: once it flowers they turn hot and tough.',
    ],
  },
  {
    ingredientId: 'salad-leaves',
    sowIndoors: [2, 3],
    sowOutdoors: [4, 5, 6, 7, 8, 9],
    plantOut: [3, 4, 5],
    tips: [
      'Sow thinly in short drills 1cm deep, or scatter over a small patch, every few weeks from spring.',
      'Cut leaves at 5 to 10cm, above the growing point, and most will regrow for two or three pickings.',
      'Oriental leaves such as mizuna and mustards do best sown from midsummer, as spring sowings bolt.',
      'Water in the morning in dry weather and keep slugs off.',
    ],
  },
  {
    ingredientId: 'radish',
    sowOutdoors: [3, 4, 5, 6, 7, 8, 9],
    tips: [
      'Sow thinly 1cm deep, 2.5cm apart, in rows 15cm apart. A short row every two weeks keeps them coming.',
      'Keep the soil moist: dry spells make them hot, woody and quick to bolt.',
      'Pull them about four weeks after they come up, while small and crisp.',
      'In midsummer sow in light shade, or wait for late summer, when they do better.',
    ],
  },
  {
    ingredientId: 'cucumber',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow one seed per small pot, on its side and 1 to 2cm deep, somewhere warm.',
      'Plant out after the last frost once nights stay above 12°C, into rich soil with a cane or net to climb.',
      'Water often and evenly, at the base. Outdoor ridge varieties are tougher than greenhouse ones.',
      'Pick them young and often, as fruit left to swell slows the plant down.',
    ],
  },
  {
    ingredientId: 'squash',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow one seed per pot on its edge, 1cm deep, and plant out after the last frost: 90cm apart for bush types, 1.5m for trailing ones.',
      'They are hungry and thirsty, so plant into plenty of compost and sink a pot beside each one to water into.',
      'Sit ripening fruit on a tile or board to keep it off damp soil.',
      'Cut winter squash before the first frost, then leave it in the sun for a week or two so the skin hardens for storing.',
    ],
  },
  {
    ingredientId: 'pumpkin',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow one seed per pot on its edge, 1cm deep, in mid to late April, then plant out after the last frost, 1.5m apart for trailing types.',
      'Plant into plenty of well-rotted manure or compost and water heavily at the roots once the fruits start to swell.',
      'For big pumpkins keep just two or three per plant, each sitting on a tile or board.',
      'Cut with a good length of stalk before the frosts, and let the skin harden in the sun before storing.',
    ],
  },
  {
    ingredientId: 'sweetcorn',
    sowIndoors: [4, 5],
    sowOutdoors: [5, 6],
    plantOut: [5, 6],
    tips: [
      'Sow one seed 2.5cm deep per deep pot or root trainer, and plant out after the last frost.',
      'Plant in a block, not a row, 35 to 45cm apart each way. It is wind pollinated, and a single row gives gappy cobs.',
      'Water in dry spells, especially when the tassels appear and the cobs swell.',
      'Pick when the silks turn brown and a kernel pressed with a nail gives milky juice.',
    ],
  },
  {
    ingredientId: 'chilli',
    sowIndoors: [2, 3, 4],
    plantOut: [5, 6],
    tips: [
      'Chillies need a long season, so sow early in a propagator or warm spot at about 21°C.',
      'Pot them on as they grow and keep them indoors until late May. They crop best in a greenhouse or on a sunny, sheltered patio.',
      'Keep the compost evenly moist, as flowers drop if it dries out, and feed with tomato feed once they flower.',
      'Pick them green or leave them to colour. Regular picking keeps more coming.',
    ],
  },
  {
    ingredientId: 'pepper',
    sowIndoors: [2, 3, 4],
    plantOut: [5, 6],
    tips: [
      'Sow in a propagator or warm spot at 18 to 21°C, then move each seedling into its own pot at two true leaves.',
      'They crop best under glass. Outside, give them your warmest, most sheltered spot once nights stay above 12°C.',
      'Keep the compost evenly moist and check the shoot tips for aphids.',
      'Peppers sweeten as they ripen from green, but picking some green lets more fruit set.',
    ],
  },
  {
    ingredientId: 'aubergine',
    sowIndoors: [2, 3],
    plantOut: [6],
    tips: [
      'Sow in a propagator at 21°C or more, as aubergines need heat and a long season.',
      'They do best in a greenhouse. Outside, plant in early June against a sunny wall and cover with fleece for a couple of weeks.',
      'Mist the leaves to keep red spider mite down, and stop large fruited types at five or six fruits.',
      'Pick while the skin is glossy: dull skin means overripe and bitter.',
    ],
  },
  {
    ingredientId: 'fennel',
    sowIndoors: [5, 6],
    sowOutdoors: [6, 7],
    plantOut: [6, 7],
    tips: [
      'Early sowings bolt, so wait until late spring and choose a bolt resistant variety.',
      'It hates root disturbance: sow one seed per module and plant out whole, or sow direct and thin to 30cm.',
      'Keep the soil moist all summer, as a dry spell is the usual trigger for bolting.',
      'Earth up the swelling bulbs to blanch them, and cut at 10 to 15cm across before they lengthen.',
    ],
  },
  {
    ingredientId: 'asparagus',
    plantOut: [3, 4],
    tips: [
      'Plant one year old crowns in spring with the roots spread over a ridge, 30 to 45cm apart and the buds just showing.',
      'Clear every perennial weed first, as a bed lasts 20 years and is hard to weed once planted.',
      'Leave the spears for the first two years. In the third, cut from mid April for six weeks, then for eight weeks in later years.',
      'Let the ferns grow all summer, cut them down when they yellow in autumn, and watch for asparagus beetles.',
    ],
  },
  {
    ingredientId: 'jerusalem-artichoke',
    plantOut: [2, 3, 4],
    tips: [
      'Plant egg-sized tubers 10 to 15cm deep and 30cm apart.',
      'They grow up to 3m tall, so put them where they will not shade other crops, and stake them on windy plots.',
      'Water in dry spells so the tubers swell, then dig as needed from late autumn through winter.',
      'Any piece left in the soil comes back next year, so lift every one if you want them gone.',
    ],
  },

  // Fruit
  {
    ingredientId: 'rhubarb',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant dormant crowns with the tip just above the soil, 75 to 90cm apart, in sun and rich, well-drained soil.',
      'Leave it alone in the first year and pull only a few stalks in the second.',
      'Pull stalks with a twist rather than cutting, take no more than a third at a time, and stop by early July.',
      'Cut off flower stems as soon as they show. The leaves are poisonous, but fine on the compost heap.',
    ],
  },
  {
    ingredientId: 'strawberry',
    plantOut: [3, 4, 5, 8, 9],
    tips: [
      'Plant with the crown sitting right at soil level, 35 to 40cm apart in rows 75cm apart, in full sun.',
      'Late summer planting gives plants time to settle in and fruit well the next year.',
      'Tuck straw under the fruit to keep it clean, and net against birds.',
      'Replace plants every three or four years, in a fresh bed, to stay ahead of disease.',
    ],
  },
  {
    ingredientId: 'raspberry',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant dormant canes 40 to 60cm apart, no deeper than before, with posts and wires ready to tie them to.',
      'They hate wet feet and shallow chalky soil, so use a raised bed on heavy ground.',
      "Summer types fruit on last year's canes: cut those out after picking. Cut autumn types to the ground in late winter.",
      'Pick on dry days as soon as the berries pull off easily.',
    ],
  },
  {
    ingredientId: 'blackberry',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Give them room: 2.5 to 3.5m between plants for most varieties, trained along wires on a fence or posts.',
      'Thornless varieties are kinder on a busy plot.',
      "They fruit on last year's canes, so after picking cut the old canes to the ground and tie in the new ones.",
      'Pick every few days, as the berries do not ripen any further once picked.',
    ],
  },
  {
    ingredientId: 'blackcurrant',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant 5cm deeper than they grew before and 1.5 to 1.8m apart, to encourage strong shoots from the base.',
      'Once established, cut out up to a third of the oldest, darkest stems to the base each winter.',
      'Net the bushes as the fruit colours, or the birds will strip them.',
      'Modern varieties ripen a whole bunch at once, so cut bunches rather than picking single berries.',
    ],
  },
  {
    ingredientId: 'redcurrant',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant bushes 1.2 to 1.5m apart. They cope with some shade, even a north facing wall, though the fruit is less sweet.',
      "They fruit at the base of last year's shoots and on spurs, so prune to an open goblet shape in late winter.",
      'Net against birds as the fruit colours, and in late winter when bullfinches peck the buds.',
      'Cut whole bunches once richly coloured and strip them in the kitchen.',
    ],
  },
  {
    ingredientId: 'gooseberry',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant bushes 1.2 to 1.5m apart in a sheltered spot, as the stems snap in strong wind. They put up with some shade.',
      'From spring, check under the leaves for gooseberry sawfly caterpillars, which can strip a bush in days.',
      'Choose a mildew resistant variety and prune in winter and summer to keep the middle of the bush open.',
      'Pick every other fruit in June for cooking, and leave the rest to ripen sweet in July and August.',
    ],
  },
  {
    ingredientId: 'apple',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant bare-root trees in winter, in sun with a stake. Check the rootstock: it decides how big the tree grows.',
      'Most need another apple flowering at the same time nearby to set fruit.',
      'Water in dry spells for the first couple of years. After that, trees in the ground seldom need it.',
      'A ripe apple comes away with a gentle lift and twist.',
    ],
  },
  {
    ingredientId: 'pear',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant in winter in a warm, sheltered spot. Pears flower early, so avoid frost pockets.',
      'Most need a second pear variety flowering nearby to fruit well.',
      'Water in dry spells while the fruit swells, or the young fruit drops.',
      'Pick when firm and swollen, just before ripe, then ripen them indoors. Late varieties can take months in store.',
    ],
  },
  {
    ingredientId: 'plum',
    plantOut: [1, 2, 3, 11, 12],
    tips: [
      'Plant in winter in a warm, sheltered spot. The blossom comes early and is easily caught by frost.',
      'Prune established trees in summer, never in winter, to keep silver leaf and canker out.',
      'Thin heavy crops in early summer so the branches do not snap.',
      'Let them ripen on the tree and pick when soft to a gentle squeeze.',
    ],
  },

  // Herbs
  {
    ingredientId: 'basil',
    sowIndoors: [3, 4, 5, 6],
    plantOut: [6, 7],
    tips: [
      'Sow thinly on the surface in a warm spot, about 20°C, and keep it indoors until early summer.',
      'It loves heat and hates wet roots overnight, so water in the morning.',
      'Pinch out the tips often to keep it bushy, and nip off flowers.',
      'A greenhouse or a sunny pot by the house suits it better than open ground.',
    ],
  },
  {
    ingredientId: 'parsley',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5, 6, 7, 8],
    plantOut: [4, 5, 6],
    tips: [
      'Seed is slow, often a month or more, so keep the drill moist and be patient.',
      'Sow 1cm deep and thin to 15 to 30cm apart, in sun or part shade with soil that stays moist.',
      'A sowing in July or early August gives leaves through autumn and winter.',
      'Pick the outer stalks and snip off yellowing leaves to keep it going.',
    ],
  },
  {
    ingredientId: 'mint',
    plantOut: [3, 4, 5, 9, 10],
    tips: [
      'Grow it in a pot, or a bottomless bucket sunk in the ground, as the roots run everywhere.',
      'It copes with sun or part shade. Water pots well in dry weather.',
      'Cut it right down after flowering for a fresh flush of leaves.',
      'Split and repot every few years to keep it vigorous.',
    ],
  },
  {
    ingredientId: 'coriander',
    sowOutdoors: [4, 5, 6, 7, 8],
    tips: [
      'Sow thinly where it is to grow, 1cm deep: it hates being moved and runs to seed.',
      'In summer sow in light shade and keep it watered, as heat and dry soil send it to seed fast.',
      'Sow a short row every three or four weeks for a steady supply of leaves.',
      'If it does flower, let the seeds ripen for the spice jar.',
    ],
  },
  {
    ingredientId: 'dill',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5, 6, 7],
    plantOut: [4, 5, 6],
    tips: [
      'Sow thinly where it is to grow, 1cm deep, or one seed per module, planted out at about four weeks old before the taproot forms.',
      'Give it a warm, sunny, sheltered spot. Cold, wet soil and dry spells both make it bolt.',
      'Sow a little every few weeks for fresh leaves all summer.',
    ],
  },
  {
    ingredientId: 'chives',
    sowIndoors: [3, 4],
    sowOutdoors: [4, 5],
    plantOut: [4, 5, 6],
    tips: [
      'Easiest bought as a pot, or sow a pinch of seed per module in spring and plant out the clumps.',
      'Plant 15cm apart in sun or part shade, in soil that stays moist.',
      'Cut to 5cm above the ground and they regrow. The flowers are good in salads.',
      'Lift and divide clumps every three or four years.',
    ],
  },
  {
    ingredientId: 'rosemary',
    plantOut: [4, 5],
    tips: [
      'Buy a plant, as seed takes years. Plant in spring in full sun and free-draining soil, 45cm from its neighbours.',
      'Winter wet kills it faster than cold, so on heavy soil use a raised bed or a pot with grit mixed in.',
      'Trim lightly after flowering to keep it bushy, but never cut into old bare wood.',
      'Pick sprigs all year. The soft new growth has the best flavour.',
    ],
  },
  {
    ingredientId: 'thyme',
    sowIndoors: [3, 4],
    plantOut: [4, 5, 6],
    tips: [
      'Seed is cheap but slow. Sow on the surface in spring, or buy plants for a quicker start.',
      'Plant 20 to 30cm apart in full sun and light, well-drained soil. Wet roots in winter rot it.',
      'Trim after flowering to stop it going woody, and replace plants every few years.',
    ],
  },
  {
    ingredientId: 'sage',
    sowIndoors: [3, 4],
    plantOut: [4, 5],
    tips: [
      'Plants are quicker than seed. Plant in spring in full sun and free-draining soil, 30cm from neighbours.',
      'Water only while it settles in. Winter wet does more harm than cold.',
      'Pick young leaves often to keep it bushy, and replace plants after six or seven years when they get straggly.',
    ],
  },
]
