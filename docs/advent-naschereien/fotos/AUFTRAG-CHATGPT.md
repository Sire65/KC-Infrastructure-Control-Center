# Fotos für das Heft „Weihnachtliche Naschereien“ mit ChatGPT besorgen

So gehst du vor:

1. ChatGPT öffnen (am besten mit Websuche, also das Symbol 🌐 „Suche“ einschalten).
2. Den **ganzen Kasten unten** kopieren und in ChatGPT einfügen.
3. ChatGPT arbeitet die Liste in Portionen ab (z. B. 10 Fotos pro Antwort). Schreibe danach jeweils **„weiter“**.
4. Die Bilder herunterladen und genau so benennen, wie in der ersten Spalte steht (z. B. `01-hexenhaus.jpg`).
5. Alle Bilder **und** die Tabelle (quellen.csv) an Claude geben. Claude legt sie in `docs/advent-naschereien/fotos/` und baut das Heft neu.

Wichtig: Nur Fotos mit freier Lizenz. Fotos von Rezeptseiten (lecker.de, Chefkoch, Instagram, Pinterest …) sind **nicht** erlaubt, auch nicht „nur für den Verein“.

```
Du hilfst mir, freie Fotos für ein Bastelheft unseres Vereins (Köcheclub, nicht kommerziell, wird gedruckt und als PDF weitergegeben) zu finden.

REGELN
- Nur Bilder mit diesen Lizenzen: CC0 / Public Domain, CC BY, CC BY-SA, Pixabay-Lizenz, Unsplash-Lizenz, Pexels-Lizenz.
- Erlaubte Quellen: commons.wikimedia.org, openverse.org, pixabay.com, unsplash.com, pexels.com, flickr.com (nur CC-Lizenzen).
- Verboten: Fotos von Rezept- oder Shop-Seiten, Pinterest, Instagram, Google-Bildersuche ohne Lizenzangabe, Bilder mit Wasserzeichen.
- Das Foto soll möglichst genau das fertige Ergebnis zeigen. Wenn es das nicht frei gibt, nimm ein Foto, das gut passt (z. B. die Hauptzutat oder etwas sehr Ähnliches), und schreibe in die Spalte "art" das Wort "ähnlich".
- Gibt es gar nichts Passendes, schreibe "keins".
- Querformat bevorzugt, mindestens 1200 Pixel breit.
- Erfinde nie einen Link oder Urheber. Jede Angabe muss von der Bildseite stammen.

AUSGABE
Gib mir für jede Zeile:
1. den direkten Link zur Bildseite (nicht nur zur Datei),
2. den direkten Download-Link,
3. eine Zeile für die Tabelle quellen.csv in genau diesem Format (Semikolon getrennt):
id;nr;titel;suchbegriff_de;suchbegriff_en;datei;art;urheber;lizenz;quelle
- datei = Dateiname aus meiner Liste + Endung (z. B. 01-hexenhaus.jpg)
- art = foto | ähnlich | keins
- urheber = Name wie auf der Bildseite
- lizenz = z. B. CC BY 2.0, CC0, Pixabay-Lizenz
- quelle = Link zur Bildseite
Am Ende jeder Portion alle CSV-Zeilen noch einmal zusammen in einem Kasten, damit ich sie kopieren kann.

MEINE LISTE (Dateiname | Titel | englischer Suchbegriff)
01-hexenhaus | Hexenhaus aus Butterkeksen | butter biscuit gingerbread house
02-lokomotive | Lokomotive aus Dominosteinen | candy train chocolate christmas
03-stall | Stall aus Zwieback | rusk nativity stable edible
04-iglu | Iglu aus Mini-Marshmallows | marshmallow igloo
05-schlitten | Schlitten aus Zuckerstangen | candy cane sleigh
06-schneemann-pfeffernuss | Schneemann aus Pfeffernüssen | pfeffernuesse snowman
07-marshmallow-schneemann | Marshmallow-Schneemann am Spieß | marshmallow snowman on a stick
08-schneemann-muffin | Schneemann-Muffin | melting snowman cupcake
09-schneemann-lolli | Schneemann-Lollis aus Doppelkeksen | oreo snowman pops
10-bananen-schneemann | Bananen-Schneemänner am Spieß | banana snowman skewer
11-nikolaus-schokokuss | Nikolaus aus Schokokuss | chocolate marshmallow santa strawberry
12-nikolaus-erdbeeren | Nikolaus-Erdbeeren | strawberry santa cream
13-brownie-muetzen | Brownie-Weihnachtsmützen | santa hat brownies
14-grinch-spiesse | Grinch-Spieße | grinch fruit kabobs
15-rentier-marshmallow | Rentier aus Marshmallow | marshmallow reindeer pretzel antlers
16-rentier-lebkuchen | Rentier aus Lebkuchenmann | gingerbread man reindeer upside down
17-rentier-bruchschokolade | Rentier-Bruchschokolade | reindeer chocolate bark
18-pinguin | Pinguin aus Mini-Schokoküssen | chocolate penguin treat
19-apfel-igel | Apfel-Igel | apple hedgehog almonds
20-eiswaffel-tanne | Tannenbaum aus Eiswaffel | ice cream cone christmas tree
21-keks-tannen | Keks-Tannen | star cookie christmas tree stack
22-obst-tanne | Obst-Tannenbaum | fruit christmas tree kiwi
23-lebkuchen-kerze | Lebkuchen-Kerze mit Mandel-Flamme | edible candle wafer roll almond flame
24-mandarinen-licht | Mandarinen-Licht (Luciatag) | clementine candle
25-brezel-schneeflocke | Schneeflocke aus Brezeln | pretzel snowflake white chocolate
26-brezel-kranz | Brezelkränze mit Schokolade | pretzel wreath chocolate
27-zauberstaebe | Zauberstäbe aus Salzstangen | chocolate dipped pretzel rods sprinkles
28-schokoloeffel | Schokolöffel für heiße Milch | hot chocolate spoons
29-naschglas | Naschglas-Schneekugel | candy jar snow globe
30-domino-paeckchen | Päckchen aus Dominosteinen | Dominostein
31-zuckerstangen-herz | Zuckerstangen-Herz | candy cane heart chocolate
32-nudel-engel | Engel aus Nudeln (Baumschmuck) | pasta angel ornament
33-popcorn-girlande | Popcorn-Girlande | popcorn cranberry garland
34-tueten-sterne | Sterne aus Butterbrottüten | paper bag star
35-papier-schneeflocken | Schneeflocken aus Papier | paper snowflake
36-filz-stiefel | Nikolausstiefel aus Filz | felt christmas stocking
37-stehauf-karte | Karte mit Stehauf-Tannenbäumen | pop up christmas tree card
38-kartoffeldruck | Geschenkpapier mit Kartoffeldruck | potato stamp wrapping paper
39-natur-verpackung | Geschenke natürlich verpacken | kraft paper gift cinnamon orange
40-salz-windlicht | Frost-Windlicht mit Salzkristallen | salt crystal jar lantern
41-orangen-girlande | Girlande aus Orangenscheiben | dried orange garland
42-nelken-orange | Duft-Orange mit Nelken | orange cloves pomander
43-zapfenwichtel | Zapfenwichtel | pine cone gnome
44-doppelvase | Leuchtende Doppelvase | vase in vase fairy lights baubles
45-servietten-tanne | Servietten-Tannenbaum | christmas tree napkin fold
```

## Alternative für Lücken: Bild von ChatGPT erzeugen lassen

Für Motive, die es nirgends frei gibt (z. B. „Schneemann aus Pfeffernüssen“), kann ChatGPT ein Bild **erzeugen**.
Dann im Bildnachweis „KI-Bild“ angeben. Vorlage zum Kopieren (Titel und Zutaten von der Heftseite einsetzen):

```
Erzeuge ein realistisches Foto, Querformat 3:2: <TITEL> – selbst gebastelt aus <ZUTATEN>.
Natürliches Tageslicht, heller Holztisch, etwas Tannengrün und Puderzucker im Hintergrund, leicht unscharf.
Keine Personen, keine Schrift, keine Markenlogos. Es soll aussehen wie zu Hause von einer Familie gebastelt, nicht wie aus einer Konditorei.
```

In der Tabelle dann: `art` = `ki`, `urheber` = `ChatGPT`, `lizenz` = `KI-generiert`, `quelle` leer lassen.
