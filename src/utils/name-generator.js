import { randomFromList } from "@/utils/random-util";

const FIRST_NAMES = [
    "Betty",
    "Brenda",
    "Doris",
    "Gladys",
    "Gina",
    "Jean",
    "Kim",
    "Mimi",
    "Nora"
];
const FOOD_NAMES = [
    "Aioli",
    "Almond",
    "Ambrosia",
    "Baklava",
    "Bolognese",
    "Borscht",
    "Calamari",
    "Cinnamon",
    "Creme Egg",
    "Custard",
    "Dumpling",
    "Eclair",
    "Flan",
    "Fudge",
    "Gelato",
    "Gnocchi",
    "Honey",
    "Ladyfingers",
    "Macaron",
    "Muffin",
    "Parfait",
    "Popsicle",
    "Praline",
    "Pudding",
    "Scrapple",
    "Soufflé",
    "Strudel",
    "Sundae",
    "Tart",
    "Toffee",
    "Truffle",
    "Waffle",
    "Zabiglione"
];

// nothing too exciting, "grand mothers first name plus last thing you ate"
export const generateDragQueenName = () => `${randomFromList( FIRST_NAMES )} ${randomFromList( FOOD_NAMES )}`;
