// Självtestfall för parsern som ren data. Körs av `npm run check` (src/fountain/check.ts).

import type { LineType } from '../types';

export interface ParseCase {
  name: string;
  input: string;
  /** Förväntad typ per rad (tomma rader = 'empty'). */
  expected: LineType[];
}

export const parseCases: ParseCase[] = [
  {
    name: 'Kalle + Vem är du? blir karaktär + dialog',
    input: '\nKalle\nVem är du?',
    expected: ['empty', 'character', 'dialogue'],
  },
  {
    name: 'Scenrubrik med INT.',
    input: 'INT. KÖKET – MORGON\n\nRadion står på.',
    expected: ['scene_heading', 'empty', 'action'],
  },
  {
    name: 'Svensk EXT utan punkt följt av mellanslag',
    input: 'EXT PARKERINGEN - NATT',
    expected: ['scene_heading'],
  },
  {
    name: 'Scenrubrik kräver tom rad före',
    input: 'Hon går ut.\nINT. KÖKET – DAG',
    expected: ['action', 'action'],
  },
  {
    name: 'INT./EXT. och I/E',
    input: 'INT./EXT. BILEN – NATT\n\nI/E BILEN – DAG',
    expected: ['scene_heading', 'empty', 'scene_heading'],
  },
  {
    name: 'Tvingad scenrubrik med punkt',
    input: '.NÅGONSTANS UTANFÖR STADEN',
    expected: ['scene_heading'],
  },
  {
    name: 'Tre punkter är inte en tvingad scenrubrik',
    input: '...och sedan tystnad.',
    expected: ['action'],
  },
  {
    name: 'Karaktär, parentetiskt, dialog',
    input: '\nPAPPA\n(vänder sig inte om)\nSamma sak.',
    expected: ['empty', 'character', 'parenthetical', 'dialogue'],
  },
  {
    name: 'Karaktär med (FORTS.)',
    input: '\nMAJA (FORTS.)\nAlice.',
    expected: ['empty', 'character', 'dialogue'],
  },
  {
    name: 'Övergångar på svenska och engelska',
    input: 'KLIPP TILL:\n\nTONA UT.\n\nSMASH CUT:\n\nCUT TO:',
    expected: ['transition', 'empty', 'transition', 'empty', 'transition', 'empty', 'transition'],
  },
  {
    name: 'Gemena övergångar är action',
    input: 'klipp till:',
    expected: ['action'],
  },
  {
    name: 'Centrerad, sektion, synopsis, anteckning',
    input: '> SLUT <\n\n# AKT ETT\n\n= Maja stannar.\n\n[[Fråga om ljud.]]',
    expected: ['centered', 'empty', 'section', 'empty', 'synopsis', 'empty', 'note'],
  },
  {
    name: 'Tvingad karaktär och tvingad action',
    input: '\n@Farmor (O.S.)\nÄr det flickan?\n\n!KALLE\nsom blir kvar',
    expected: ['empty', 'character', 'dialogue', 'empty', 'action', 'action'],
  },
  {
    name: 'Kort mening med punkt är action, inte karaktär',
    input: '\nRast.\nMaja sitter på ett cykelställ.',
    expected: ['empty', 'action', 'action'],
  },
  {
    name: 'Fem ord i gemener är action',
    input: '\nhon går sakta mot bussen\nden kommer inte',
    expected: ['empty', 'action', 'action'],
  },
  {
    name: 'Karaktär kräver att nästa rad inte är tom',
    input: '\nMAJA\n\nNågot.',
    expected: ['empty', 'action', 'empty', 'action'],
  },
  {
    name: 'Scenrubrik i punktstil ("PLATS. TID.")',
    input: 'EXT. PARK. DAG.\n\nSolen skiner.',
    expected: ['scene_heading', 'empty', 'action'],
  },
  {
    name: 'Manuellt scennummer framför rubriken ("2. EXT. …")',
    input: '2. EXT. KIOSK. DAG.\n\nHan går in.',
    expected: ['scene_heading', 'empty', 'action'],
  },
  {
    name: 'Manuellt scennummer med bokstav ("7A. INT. …")',
    input: '7A. INT. LISAS LÄGENHET. KVÄLL\n\nDe pratar.',
    expected: ['scene_heading', 'empty', 'action'],
  },
  {
    name: 'Karaktärsnamn med avslutande kolon ("Måns:")',
    input: '\nMåns:\nJamen aj som fan.',
    expected: ['empty', 'character', 'dialogue'],
  },
];
