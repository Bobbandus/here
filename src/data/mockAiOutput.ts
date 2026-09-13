// PLATSHÅLLARE. Statisk exempeldata för AI-panelerna.
// Ingen modell, inget nätverk, inga nycklar. Ersätts vid framtida integration.

import type { AiKind, AiOutput, CreativeAiOutput, MeasureAiOutput } from '../types';

const synopsis: CreativeAiOutput = {
  kind: 'creative',
  id: 'synopsis',
  title: 'Synopsis',
  variants: [
    {
      label: 'Variant 1',
      items: [
        {
          text: 'Maja och Leo delar en energidryck på en tom parkering. Leo säger att bara de blir kvar; lysröret slocknar. Han visar nästan en lapp men stoppar tillbaka den.',
          meta: '38 ORD',
        },
      ],
    },
    {
      label: 'Variant 2',
      items: [
        {
          text: 'Natt på parkeringen. Ett skämt om vem som stannar blir en fråga ingen av dem vill svara på. Lappen i Leos ficka stannar där — för nu.',
          meta: '29 ORD',
        },
      ],
    },
    {
      label: 'Variant 3',
      items: [
        {
          text: 'Två vänner, en bil, ett blinkande lysrör. Leo har redan bestämt sig; Maja har inte ens frågat sig själv.',
          meta: '20 ORD',
        },
      ],
    },
  ],
};

const shotlist: CreativeAiOutput = {
  kind: 'creative',
  id: 'shotlist',
  title: 'Shotlist',
  variants: [
    {
      label: 'Variant 1',
      items: [
        { text: '1A · WS etablering, bilen ensam under lysröret, statisk', meta: '16 mm · 0:08' },
        { text: '1B · MS två-shot från fronten, båda på motorhuven', meta: '35 mm · 0:40' },
        { text: '1C · OTS över Leo mot Maja', meta: '85 mm · 0:25' },
        { text: '1D · OTS över Maja mot Leo', meta: '85 mm · 0:25' },
        { text: '1E · CU lysröret, blinkar och slocknar', meta: '85 mm · 0:04' },
        { text: '1F · Insert, Leos hand och lappen i fickan', meta: '35 mm · 0:05' },
      ],
    },
    {
      label: 'Variant 2',
      items: [
        { text: '2A · Långsam dolly in från WS till MS, en tagning', meta: '24 mm · 1:10' },
        { text: '2B · Profil två-shot, lysröret i bakgrundens mitt', meta: '35 mm · 0:45' },
        { text: '2C · CU Maja, reaktion när lampan slocknar', meta: '85 mm · 0:06' },
        { text: '2D · Insert lappen, rack focus till Majas ansikte', meta: '85 mm · 0:05' },
      ],
    },
    {
      label: 'Variant 3',
      items: [
        { text: '3A · Handhållen MCU, växlar mellan dem utan klipp', meta: '24–70 mm · 1:30' },
        { text: '3B · Extrem WS från andra sidan parkeringen, ljud nära', meta: '24–70 mm @ 70 · 0:15' },
        { text: '3C · Insert energidrycken som byter hand', meta: '35 mm · 0:04' },
      ],
    },
  ],
};

const blocking: CreativeAiOutput = {
  kind: 'creative',
  id: 'blocking',
  title: 'Blockning',
  variants: [
    {
      label: 'Variant 1',
      items: [
        { text: 'Maja och Leo sitter bredvid varandra på motorhuven, vända mot kameran', meta: 'START' },
        { text: 'Leo lutar sig bakåt mot vindrutan på "bara du och jag kvar"', meta: 'REPLIK 1' },
        { text: 'Leo reser sig och pekar på lysröret, står kvar vid stötfångaren', meta: 'REPLIK 3' },
        { text: 'Maja blir sittande, drar upp knäna när lampan slocknar', meta: 'SLUT' },
      ],
    },
    {
      label: 'Variant 2',
      items: [
        { text: 'Leo står lutad mot förardörren, Maja sitter på motorhuven', meta: 'START' },
        { text: 'Leo går runt bilen under dialogen och hamnar bredvid Maja', meta: 'REPLIK 1–3' },
        { text: 'Båda tittar upp mot lysröret, ryggarna mot kameran', meta: 'SLUT' },
      ],
    },
    {
      label: 'Variant 3',
      items: [
        { text: 'Maja står vid lyktstolpen, Leo sitter i förarsätet med dörren öppen', meta: 'START' },
        { text: 'Maja går fram och sätter sig på motorhuven på "Och pappa."', meta: 'REPLIK 2' },
        { text: 'Leo kliver ur, räcker nästan fram lappen, stoppar den i fickan', meta: 'SLUT' },
      ],
    },
  ],
};

const lens: MeasureAiOutput = {
  kind: 'measure',
  id: 'lens',
  title: 'Linsval',
  rows: [
    { parameter: 'Horisontell bildvinkel · 35 mm', measured: '39.1°', threshold: '≥ 38.0°', deviation: null },
    { parameter: 'Motivavstånd två-shot', measured: '3.4 m', threshold: '≤ 4.0 m', deviation: null },
    { parameter: 'Skärpedjup vid f/1.8 · 3.4 m', measured: '0.62 m', threshold: '≥ 0.80 m', deviation: '−0.18 m' },
    { parameter: 'Ljusnivå parkering (spot)', measured: '4 lux', threshold: '≥ 6 lux', deviation: '−2 lux' },
    { parameter: 'Förvrängning i kant · 16 mm', measured: '2.9 %', threshold: '≤ 3.0 %', deviation: null },
  ],
};

const audio: MeasureAiOutput = {
  kind: 'measure',
  id: 'audio',
  title: 'Mikrofonplacering',
  rows: [
    { parameter: 'Bakgrundsnivå (lysrörsbrum)', measured: '−52 dBFS', threshold: '≤ −60 dBFS', deviation: '+8 dB' },
    { parameter: 'Dialogtopp, uppskattad', measured: '−14 dBFS', threshold: '−18 … −10 dBFS', deviation: null },
    { parameter: 'Avstånd bom–talare', measured: '45 cm', threshold: '30–60 cm', deviation: null },
    { parameter: 'Brumfrekvens', measured: '100 Hz', threshold: 'filtreras < 80 Hz', deviation: '+20 Hz' },
    { parameter: 'Vindhastighet, prognos', measured: '3 m/s', threshold: '≤ 5 m/s med vindskydd', deviation: null },
  ],
};

const review: MeasureAiOutput = {
  kind: 'measure',
  id: 'review',
  title: 'Materialgranskning',
  rows: [
    { parameter: 'Ljudtopp · TC 00:14:32:07', measured: '−0.4 dBFS', threshold: '≤ −3.0 dBFS', deviation: '+2.6 dB' },
    { parameter: 'Vitbalans · tagning 4C', measured: '4650 K', threshold: '3200 K ± 200', deviation: '+1450 K' },
    {
      parameter: 'Kontinuitet · energidryck',
      measured: 'vänster hand · TC 00:15:02:11',
      threshold: 'höger hand · TC 00:14:58:03',
      deviation: 'Byte av hand',
    },
  ],
  cleanRows: [],
};

export const mockAiOutput: Record<AiKind, AiOutput> = {
  synopsis,
  lens,
  shotlist,
  blocking,
  audio,
  review,
};
