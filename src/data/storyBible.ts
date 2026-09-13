import type { BibleNote, Character, Location } from '../types';

// Karaktärsfärger hålls inom varumärkets palett.
const C = {
  accent: '#3be389',
  gold: '#ffce3f',
  flare: '#ff4b3e',
  text: '#f4f2ec',
  dim: '#1f9a61',
  muted: '#9a9aa0',
};

export const characters: Character[] = [
  {
    id: 'ch-maja',
    name: 'MAJA',
    age: '17',
    description: 'Räknar mynt och bussavgångar. Vill bort men har aldrig sagt det högt, minst av allt till sin pappa.',
    color: C.accent,
  },
  {
    id: 'ch-leo',
    name: 'LEO',
    age: '17',
    description: 'Majas äldsta vän. Kör en Volvo som inte borde gå. Har redan köpt en enkelbiljett men inte berättat.',
    color: C.gold,
  },
  {
    id: 'ch-alice',
    name: 'ALICE',
    age: '17',
    description: 'Nyinflyttad från Göteborg. För välklädd för stället. Den enda som faktiskt valt att komma hit.',
    color: C.flare,
  },
  {
    id: 'ch-pappa',
    name: 'PAPPA',
    age: '50-tal',
    description: 'Majas pappa. Svarar kortare än han menar. Steker ägg i en för stor stekpanna varje morgon.',
    color: C.text,
  },
  {
    id: 'ch-farmor',
    name: 'FARMOR',
    age: '80-tal',
    description: 'Hörs oftare än hon syns. Bor i rummet innanför köket och har åsikter om alla som kommer in.',
    color: C.dim,
  },
  {
    id: 'ch-kalle',
    name: 'KALLE',
    age: '13',
    description: 'Yngre kille på skolgården. Frågar det ingen annan vågar fråga. Tror att alla blir kvar.',
    color: C.muted,
  },
  {
    id: 'ch-rektorn',
    name: 'REKTORN',
    age: '60',
    description: 'Har sett tjugo årskullar försvinna. Pratar om framtiden som om den ligger i ett annat län.',
    color: C.muted,
  },
  {
    id: 'ch-sara',
    name: 'SARA',
    age: '18',
    description: 'Klasskamrat som flyttar till Umeå efter sommaren. Planerar avskedsfesten sedan januari.',
    color: C.dim,
  },
  {
    id: 'ch-jonna',
    name: 'JONNA',
    age: '17',
    description: 'Jobbar extra på macken. Vet allt som händer i stan innan det har hänt.',
    color: C.muted,
  },
  {
    id: 'ch-busschauffor',
    name: 'BUSSCHAUFFÖREN',
    age: '40-tal',
    description: 'Stannar aldrig vid fel hållplats. Stannar sällan vid rätt heller.',
    color: C.muted,
  },
  {
    id: 'ch-tove',
    name: 'TOVE',
    age: '30-tal',
    description: 'Majas kusin som flyttade tillbaka. Beviset på att man kan komma hem igen, eller varningen.',
    color: C.dim,
  },
];

export const locations: Location[] = [
  {
    id: 'loc-busshallplatsen',
    name: 'BUSSHÅLLPLATSEN',
    int_ext: 'EXT',
    description: 'Ensam busskur vid länsväg, trasig reklamtavla, fält åt alla håll. Dimma i gryningen.',
  },
  {
    id: 'loc-koket',
    name: 'KÖKET',
    int_ext: 'INT',
    description: 'Trångt 70-talskök. Radion står alltid på. Dörr in till farmors rum.',
  },
  {
    id: 'loc-skolkorridoren',
    name: 'SKOLKORRIDOREN',
    int_ext: 'INT',
    description: 'Lysrör, skåpväggar, linoleum. Filmas efter skoltid, max två timmar per tillfälle.',
  },
  {
    id: 'loc-parkeringen',
    name: 'PARKERINGEN',
    int_ext: 'EXT',
    description: 'Tom parkering vid idrottshallen. Ett lysrör som blinkar. Kräver tillstånd från kommunen.',
  },
  {
    id: 'loc-bilen',
    name: 'BILEN',
    int_ext: 'INT/EXT',
    description: 'Leos Volvo 240. Inspelning på trailer eller stillastående med regnmaskin.',
  },
  {
    id: 'loc-skolgarden',
    name: 'SKOLGÅRDEN',
    int_ext: 'EXT',
    description: 'Asfalt, cykelställ, grind mot vägen. Rasttider ger bakgrundsstatister gratis.',
  },
];

export const bibleNotes: BibleNote[] = [
  {
    id: 'note-1',
    title: 'Ton',
    body: 'Ingen karaktär säger vad den känner. Allt ligger i vad de inte gör — bussen, biljetten, äggen.',
  },
  {
    id: 'note-2',
    title: 'Motiv: lysröret',
    body: 'Lysröret på parkeringen återkommer i akt tre. Det ska vara samma armatur, lagra den.',
  },
  {
    id: 'note-3',
    title: 'Språk',
    body: 'Dialekt från Alingsås, inte Göteborg. Alice är den enda som låter "stan".',
  },
  {
    id: 'note-4',
    title: 'Öppen fråga',
    body: 'Behövs farmor i bild alls? Hittills fungerar hon bättre som (O.S.).',
  },
];
