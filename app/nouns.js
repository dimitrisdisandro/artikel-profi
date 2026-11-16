'use strict';
/*
 * Wortschatz für «Artikel-Profi»
 *
 * Format pro Zeile:  Singular|Geschlecht|Plural|Stufe|Optionen
 *   Geschlecht: m = der, f = die, n = das, p = nur Mehrzahl (die Eltern)
 *   Plural:     '-' = keine Mehrzahl
 *   Stufe:      1 = Kernwortschatz (kommt oft), 2 = häufig, 3 = selten
 *   Optionen:   w        = schwaches Maskulinum (den Hasen, dem Hasen, des Hasen)
 *               u        = nicht zählbar (kein «ein/eine», z.B. die Milch)
 *               G=Wort   = Genitiv Singular, falls die Regel nicht passt
 *
 * Die Stufen sind eine Einschätzung des Kinderwortschatzes, keine
 * geprüfte Häufigkeitsliste. Einzelne Wörter dürfen frei umgestuft werden.
 */
const NOUN_DATA = [
  // ── Tiere ──
  'Hund|m|Hunde|1', 'Katze|f|Katzen|1', 'Pferd|n|Pferde|1', 'Kuh|f|Kühe|1', 'Schwein|n|Schweine|1',
  'Schaf|n|Schafe|1', 'Vogel|m|Vögel|1', 'Fisch|m|Fische|1', 'Maus|f|Mäuse|1', 'Hase|m|Hasen|1|w',
  'Bär|m|Bären|1|w', 'Löwe|m|Löwen|1|w', 'Affe|m|Affen|1|w', 'Elefant|m|Elefanten|1|w', 'Tiger|m|Tiger|2',
  'Giraffe|f|Giraffen|2', 'Zebra|n|Zebras|2', 'Ente|f|Enten|1', 'Gans|f|Gänse|2', 'Huhn|n|Hühner|1',
  'Hahn|m|Hähne|2', 'Frosch|m|Frösche|1', 'Schlange|f|Schlangen|2', 'Spinne|f|Spinnen|1', 'Biene|f|Bienen|1',
  'Schmetterling|m|Schmetterlinge|2', 'Käfer|m|Käfer|2', 'Ameise|f|Ameisen|2', 'Fliege|f|Fliegen|2',
  'Wurm|m|Würmer|2', 'Schnecke|f|Schnecken|2', 'Eichhörnchen|n|Eichhörnchen|2', 'Igel|m|Igel|2',
  'Fuchs|m|Füchse|2', 'Wolf|m|Wölfe|2', 'Reh|n|Rehe|3', 'Hirsch|m|Hirsche|3', 'Delfin|m|Delfine|2',
  'Wal|m|Wale|2', 'Hai|m|Haie|3', 'Krokodil|n|Krokodile|2', 'Schildkröte|f|Schildkröten|2',
  'Papagei|m|Papageien|3', 'Taube|f|Tauben|2', 'Adler|m|Adler|3', 'Eule|f|Eulen|2', 'Pinguin|m|Pinguine|2',
  'Känguru|n|Kängurus|3', 'Nashorn|n|Nashörner|3', 'Kamel|n|Kamele|3', 'Esel|m|Esel|2', 'Ziege|f|Ziegen|2',
  'Kaninchen|n|Kaninchen|1', 'Hamster|m|Hamster|2', 'Meerschweinchen|n|Meerschweinchen|2',
  'Marienkäfer|m|Marienkäfer|2', 'Krebs|m|Krebse|3', 'Qualle|f|Quallen|3', 'Seehund|m|Seehunde|3',
  'Welpe|m|Welpen|3|w', 'Kätzchen|n|Kätzchen|2', 'Küken|n|Küken|3', 'Lamm|n|Lämmer|3', 'Stier|m|Stiere|3',
  'Maulwurf|m|Maulwürfe|3|G=Maulwurfs', 'Mücke|f|Mücken|3', 'Gorilla|m|Gorillas|3', 'Eisbär|m|Eisbären|2|w',
  'Wespe|f|Wespen|3',

  // ── Essen und Trinken ──
  'Apfel|m|Äpfel|1', 'Birne|f|Birnen|2', 'Banane|f|Bananen|1', 'Orange|f|Orangen|2', 'Erdbeere|f|Erdbeeren|2',
  'Kirsche|f|Kirschen|2', 'Traube|f|Trauben|2', 'Zitrone|f|Zitronen|3', 'Melone|f|Melonen|3', 'Brot|n|Brote|1',
  'Brötchen|n|Brötchen|1', 'Butter|f|-|2|u', 'Käse|m|-|1|u', 'Wurst|f|Würste|1', 'Schinken|m|Schinken|2',
  'Ei|n|Eier|1', 'Milch|f|-|1|u', 'Wasser|n|-|1|u', 'Saft|m|Säfte|2', 'Tee|m|Tees|2', 'Kuchen|m|Kuchen|1',
  'Torte|f|Torten|2', 'Keks|m|Kekse|2', 'Schokolade|f|Schokoladen|2', 'Bonbon|n|Bonbons|2', 'Eis|n|-|1|u',
  'Pizza|f|Pizzas|1', 'Nudel|f|Nudeln|1', 'Reis|m|-|2|u', 'Kartoffel|f|Kartoffeln|1', 'Tomate|f|Tomaten|1',
  'Gurke|f|Gurken|2', 'Karotte|f|Karotten|2', 'Salat|m|Salate|2', 'Zwiebel|f|Zwiebeln|2', 'Paprika|f|Paprikas|3',
  'Pilz|m|Pilze|2', 'Suppe|f|Suppen|1', 'Pommes|p|Pommes|2', 'Hamburger|m|Hamburger|2',
  'Sandwich|n|Sandwiches|3|G=Sandwiches', 'Honig|m|-|2|u', 'Marmelade|f|Marmeladen|2', 'Zucker|m|-|2|u', 'Salz|n|-|2|u',
  'Mehl|n|-|3|u', 'Nuss|f|Nüsse|2', 'Mandel|f|Mandeln|3', 'Frühstück|n|Frühstücke|2|x',
  'Mittagessen|n|Mittagessen|2|x', 'Abendessen|n|Abendessen|2|x', 'Joghurt|m|Joghurts|2', 'Müesli|n|Müeslis|3',
  'Apfelsaft|m|Apfelsäfte|3', 'Glace|f|Glaces|3', 'Brezel|f|Brezeln|3', 'Spaghetti|p|Spaghetti|3',

  // ── Schule ──
  'Schule|f|Schulen|1', 'Lehrer|m|Lehrer|1', 'Lehrerin|f|Lehrerinnen|1', 'Schüler|m|Schüler|1',
  'Schülerin|f|Schülerinnen|2', 'Klasse|f|Klassen|1', 'Buch|n|Bücher|1', 'Heft|n|Hefte|1', 'Stift|m|Stifte|1',
  'Bleistift|m|Bleistifte|1', 'Radiergummi|m|Radiergummis|2', 'Lineal|n|Lineale|2', 'Schere|f|Scheren|2',
  'Kleber|m|Kleber|3', 'Tafel|f|Tafeln|1', 'Kreide|f|Kreiden|3', 'Pult|n|Pulte|3', 'Tisch|m|Tische|1',
  'Stuhl|m|Stühle|1', 'Ranzen|m|Ranzen|2', 'Tasche|f|Taschen|1', 'Federmäppchen|n|Federmäppchen|2',
  'Zeugnis|n|Zeugnisse|3', 'Aufgabe|f|Aufgaben|1|x', 'Hausaufgabe|f|Hausaufgaben|2|x', 'Prüfung|f|Prüfungen|3|x',
  'Note|f|Noten|2|x', 'Pause|f|Pausen|1|x', 'Schulhof|m|Schulhöfe|2', 'Turnhalle|f|Turnhallen|2',
  'Bibliothek|f|Bibliotheken|2', 'Zahl|f|Zahlen|1|x', 'Buchstabe|m|Buchstaben|2|w|G=Buchstabens', 'Wort|n|Wörter|1',
  'Satz|m|Sätze|2', 'Text|m|Texte|2|G=Textes', 'Geschichte|f|Geschichten|1', 'Märchen|n|Märchen|2',
  'Gedicht|n|Gedichte|3', 'Bild|n|Bilder|1', 'Zeichnung|f|Zeichnungen|2', 'Farbe|f|Farben|1',
  'Pinsel|m|Pinsel|2', 'Papier|n|Papiere|2', 'Computer|m|Computer|2', 'Uhr|f|Uhren|1', 'Kalender|m|Kalender|3',
  'Landkarte|f|Landkarten|3', 'Globus|m|Globen|3|G=Globus', 'Ordner|m|Ordner|3', 'Zirkel|m|Zirkel|3',
  'Rucksack|m|Rucksäcke|1',

  // ── Familie und Menschen ──
  'Mutter|f|Mütter|1', 'Vater|m|Väter|1', 'Mama|f|Mamas|1', 'Papa|m|Papas|1', 'Eltern|p|Eltern|1',
  'Bruder|m|Brüder|1', 'Schwester|f|Schwestern|1', 'Geschwister|p|Geschwister|2', 'Oma|f|Omas|1', 'Opa|m|Opas|1',
  'Grossmutter|f|Grossmütter|3', 'Grossvater|m|Grossväter|3', 'Onkel|m|Onkel|2', 'Tante|f|Tanten|2',
  'Cousin|m|Cousins|3', 'Cousine|f|Cousinen|3', 'Kind|n|Kinder|1', 'Baby|n|Babys|1', 'Junge|m|Jungen|1|w',
  'Mädchen|n|Mädchen|1', 'Mann|m|Männer|1', 'Frau|f|Frauen|1', 'Freund|m|Freunde|1', 'Freundin|f|Freundinnen|1',
  'Arzt|m|Ärzte|2|G=Arztes', 'Ärztin|f|Ärztinnen|2', 'Polizist|m|Polizisten|2|w', 'Feuerwehrmann|m|Feuerwehrmänner|2|G=Feuerwehrmannes',
  'Bäcker|m|Bäcker|2', 'Koch|m|Köche|2', 'Ritter|m|Ritter|3', 'König|m|Könige|2', 'Königin|f|Königinnen|2',
  'Prinzessin|f|Prinzessinnen|2', 'Prinz|m|Prinzen|3|w', 'Hexe|f|Hexen|3', 'Zauberer|m|Zauberer|3',
  'Pirat|m|Piraten|3|w', 'Clown|m|Clowns|3|G=Clowns', 'Dieb|m|Diebe|3', 'Leute|p|Leute|2', 'Mensch|m|Menschen|2|w',
  'Gast|m|Gäste|2', 'Held|m|Helden|3|w', 'Riese|m|Riesen|3|w', 'Zwerg|m|Zwerge|3', 'Drache|m|Drachen|3|w',
  'Engel|m|Engel|3', 'Fee|f|Feen|3', 'Monster|n|Monster|3', 'Gespenst|n|Gespenster|3|G=Gespenstes',
  'Gärtner|m|Gärtner|3', 'Sänger|m|Sänger|3', 'Tänzerin|f|Tänzerinnen|3',

  // ── Haus und Alltag ──
  'Haus|n|Häuser|1', 'Wohnung|f|Wohnungen|2', 'Zimmer|n|Zimmer|1', 'Küche|f|Küchen|1', 'Bad|n|Bäder|2',
  'Badezimmer|n|Badezimmer|2', 'Schlafzimmer|n|Schlafzimmer|2', 'Wohnzimmer|n|Wohnzimmer|2',
  'Kinderzimmer|n|Kinderzimmer|2', 'Keller|m|Keller|2', 'Dach|n|Dächer|2', 'Treppe|f|Treppen|2', 'Tür|f|Türen|1',
  'Fenster|n|Fenster|1', 'Wand|f|Wände|2', 'Boden|m|Böden|2', 'Garten|m|Gärten|1', 'Balkon|m|Balkone|3',
  'Garage|f|Garagen|3', 'Zaun|m|Zäune|3', 'Bett|n|Betten|1', 'Sofa|n|Sofas|1', 'Schrank|m|Schränke|2',
  'Regal|n|Regale|2', 'Lampe|f|Lampen|1', 'Teppich|m|Teppiche|2', 'Spiegel|m|Spiegel|2', 'Vorhang|m|Vorhänge|3',
  'Kissen|n|Kissen|2', 'Decke|f|Decken|2', 'Telefon|n|Telefone|2', 'Fernseher|m|Fernseher|1', 'Radio|n|Radios|2',
  'Kamera|f|Kameras|3', 'Handy|n|Handys|1', 'Löffel|m|Löffel|1', 'Gabel|f|Gabeln|1', 'Messer|n|Messer|1',
  'Tasse|f|Tassen|1', 'Glas|n|Gläser|1', 'Flasche|f|Flaschen|1', 'Topf|m|Töpfe|2', 'Pfanne|f|Pfannen|2',
  'Becher|m|Becher|2', 'Schüssel|f|Schüsseln|2', 'Teller|m|Teller|1', 'Kühlschrank|m|Kühlschränke|2',
  'Herd|m|Herde|3', 'Ofen|m|Öfen|2', 'Besen|m|Besen|3', 'Eimer|m|Eimer|3', 'Seife|f|Seifen|2',
  'Handtuch|n|Handtücher|2', 'Zahnbürste|f|Zahnbürsten|2', 'Kamm|m|Kämme|3', 'Bürste|f|Bürsten|3',
  'Schlüssel|m|Schlüssel|1', 'Brille|f|Brillen|2', 'Kerze|f|Kerzen|2', 'Geschenk|n|Geschenke|1',
  'Brief|m|Briefe|2', 'Paket|n|Pakete|3', 'Zeitung|f|Zeitungen|2', 'Geld|n|-|2|u', 'Münze|f|Münzen|3',
  'Portemonnaie|n|Portemonnaies|3', 'Korb|m|Körbe|2', 'Kiste|f|Kisten|2', 'Schachtel|f|Schachteln|3',
  'Sack|m|Säcke|3', 'Mülleimer|m|Mülleimer|3', 'Seil|n|Seile|3', 'Hammer|m|Hämmer|3', 'Nagel|m|Nägel|3',
  'Leiter|f|Leitern|3', 'Werkzeug|n|Werkzeuge|3', 'Schirm|m|Schirme|2', 'Mütze|f|Mützen|1', 'Jacke|f|Jacken|1',
  'Hose|f|Hosen|1', 'Schuh|m|Schuhe|1', 'Socke|f|Socken|1', 'Hut|m|Hüte|2', 'Kleid|n|Kleider|1', 'Rock|m|Röcke|2',
  'Pullover|m|Pullover|2', 'Hemd|n|Hemden|2', 'T-Shirt|n|T-Shirts|2|G=T-Shirts', 'Schal|m|Schals|2',
  'Handschuh|m|Handschuhe|2', 'Stiefel|m|Stiefel|2', 'Gürtel|m|Gürtel|3', 'Pyjama|m|Pyjamas|3',
  'Badehose|f|Badehosen|3', 'Ring|m|Ringe|3', 'Kette|f|Ketten|3', 'Armband|n|Armbänder|3',
  'Staubsauger|m|Staubsauger|3', 'Waschmaschine|f|Waschmaschinen|3',

  // ── Natur, Wetter und Orte ──
  'Baum|m|Bäume|1', 'Blume|f|Blumen|1', 'Wald|m|Wälder|1', 'Wiese|f|Wiesen|2', 'Feld|n|Felder|2', 'Berg|m|Berge|1',
  'Tal|n|Täler|3', 'Fluss|m|Flüsse|2', 'Bach|m|Bäche|2', 'See|m|Seen|2|G=Sees', 'Meer|n|Meere|2', 'Strand|m|Strände|2',
  'Insel|f|Inseln|3', 'Sand|m|-|2|u', 'Stein|m|Steine|1', 'Felsen|m|Felsen|3', 'Blatt|n|Blätter|2', 'Ast|m|Äste|2',
  'Gras|n|-|2|u', 'Rose|f|Rosen|2', 'Tulpe|f|Tulpen|3', 'Sonne|f|-|1|u', 'Mond|m|Monde|1', 'Stern|m|Sterne|1',
  'Himmel|m|-|1|u', 'Wolke|f|Wolken|1', 'Regen|m|-|1|u|x', 'Schnee|m|-|1|u|x', 'Wind|m|Winde|2|x', 'Sturm|m|Stürme|3|x',
  'Gewitter|n|Gewitter|3|x', 'Blitz|m|Blitze|3|x', 'Regenbogen|m|Regenbogen|2', 'Nebel|m|-|3|u|x', 'Welt|f|Welten|3|x',
  'Erde|f|-|2|u', 'Feuer|n|Feuer|2|G=Feuers', 'Luft|f|-|2|u|x', 'Pflanze|f|Pflanzen|2', 'Tanne|f|Tannen|3', 'Zweig|m|Zweige|3',
  'Hügel|m|Hügel|3', 'Höhle|f|Höhlen|3', 'Dorf|n|Dörfer|2', 'Stadt|f|Städte|1', 'Strasse|f|Strassen|1',
  'Weg|m|Wege|1', 'Brücke|f|Brücken|2', 'Park|m|Parks|2|G=Parks', 'Spielplatz|m|Spielplätze|1', 'Zoo|m|Zoos|1',
  'Bauernhof|m|Bauernhöfe|2', 'Schloss|n|Schlösser|2', 'Burg|f|Burgen|3', 'Kirche|f|Kirchen|2', 'Turm|m|Türme|2',
  'Markt|m|Märkte|2', 'Laden|m|Läden|2', 'Geschäft|n|Geschäfte|3', 'Bahnhof|m|Bahnhöfe|2',
  'Flughafen|m|Flughäfen|3', 'Hafen|m|Häfen|3', 'Gipfel|m|Gipfel|3', 'Wüste|f|Wüsten|3',
  'Dschungel|m|Dschungel|3',

  // ── Fahrzeuge ──
  'Auto|n|Autos|1', 'Bus|m|Busse|1|G=Busses', 'Zug|m|Züge|1', 'Fahrrad|n|Fahrräder|1', 'Roller|m|Roller|2',
  'Motorrad|n|Motorräder|2', 'Schiff|n|Schiffe|2', 'Boot|n|Boote|2', 'Flugzeug|n|Flugzeuge|1',
  'Hubschrauber|m|Hubschrauber|3', 'Rakete|f|Raketen|3', 'Traktor|m|Traktoren|3', 'Lastwagen|m|Lastwagen|3',
  'Taxi|n|Taxis|3', 'Tram|n|Trams|3|G=Trams', 'Feuerwehrauto|n|Feuerwehrautos|3', 'Krankenwagen|m|Krankenwagen|3',
  'Rad|n|Räder|2', 'Reifen|m|Reifen|3', 'Ampel|f|Ampeln|2',

  // ── Spielen und Freizeit ──
  'Ball|m|Bälle|1', 'Puppe|f|Puppen|1', 'Teddy|m|Teddys|1', 'Spielzeug|n|Spielzeuge|2', 'Spiel|n|Spiele|1',
  'Puzzle|n|Puzzles|2', 'Kuscheltier|n|Kuscheltiere|2', 'Rutsche|f|Rutschen|2', 'Schaukel|f|Schaukeln|2',
  'Sandkasten|m|Sandkästen|3', 'Fussball|m|Fussbälle|1', 'Tor|n|Tore|2', 'Netz|n|Netze|3', 'Gitarre|f|Gitarren|3',
  'Klavier|n|Klaviere|3', 'Trommel|f|Trommeln|3', 'Flöte|f|Flöten|3', 'Geige|f|Geigen|3', 'Lied|n|Lieder|1|x',
  'Musik|f|-|2|u|x', 'Film|m|Filme|1|x', 'Fest|n|Feste|2|x', 'Party|f|Partys|2|x', 'Geburtstag|m|Geburtstage|1|x',
  'Ferien|p|Ferien|1|x', 'Urlaub|m|Urlaube|2|x', 'Reise|f|Reisen|2|x', 'Ausflug|m|Ausflüge|2|x', 'Zelt|n|Zelte|3',
  'Schwimmbad|n|Schwimmbäder|2', 'Luftballon|m|Luftballons|2', 'Kostüm|n|Kostüme|3', 'Maske|f|Masken|3',
  'Zirkus|m|Zirkusse|3|G=Zirkus', 'Foto|n|Fotos|2', 'Comic|m|Comics|3', 'Rätsel|n|Rätsel|3|x', 'Witz|m|Witze|2|x',
  'Karussell|n|Karussells|3', 'Schlitten|m|Schlitten|3', 'Skateboard|n|Skateboards|3',

  // ── Körper und Gefühle ──
  'Kopf|m|Köpfe|1', 'Haar|n|Haare|1', 'Gesicht|n|Gesichter|1', 'Auge|n|Augen|1', 'Ohr|n|Ohren|1', 'Nase|f|Nasen|1',
  'Mund|m|Münder|1', 'Zahn|m|Zähne|1', 'Zunge|f|Zungen|2', 'Hals|m|Hälse|2', 'Arm|m|Arme|1', 'Hand|f|Hände|1',
  'Finger|m|Finger|1', 'Bein|n|Beine|1', 'Fuss|m|Füsse|1', 'Knie|n|Knie|2', 'Bauch|m|Bäuche|1', 'Rücken|m|Rücken|2',
  'Herz|n|Herzen|2|G=Herzens', 'Daumen|m|Daumen|3', 'Ellbogen|m|Ellbogen|3', 'Schulter|f|Schultern|3',
  'Lippe|f|Lippen|3', 'Stirn|f|-|3', 'Wange|f|Wangen|3', 'Zeh|m|Zehen|3|G=Zehs', 'Haut|f|-|3|u', 'Gefühl|n|Gefühle|2|x',
  'Freude|f|-|2|x|u', 'Angst|f|Ängste|2|x', 'Wut|f|-|3|x|u', 'Traum|m|Träume|2|x', 'Idee|f|Ideen|2|x', 'Frage|f|Fragen|1|x',
  'Antwort|f|Antworten|1|x', 'Fehler|m|Fehler|1|x', 'Problem|n|Probleme|2|x', 'Geheimnis|n|Geheimnisse|3|x', 'Hilfe|f|-|2|x|u',

  // ── Zeit und Allgemeines ──
  'Tag|m|Tage|1|x', 'Nacht|f|Nächte|1|x', 'Morgen|m|Morgen|2|x', 'Abend|m|Abende|2|x', 'Woche|f|Wochen|1|x', 'Monat|m|Monate|2|x',
  'Jahr|n|Jahre|1|x', 'Stunde|f|Stunden|1|x', 'Minute|f|Minuten|2|x', 'Sekunde|f|Sekunden|3|x', 'Sommer|m|Sommer|1|x',
  'Winter|m|Winter|1|x', 'Frühling|m|Frühlinge|3|x', 'Herbst|m|Herbste|3|G=Herbstes|x', 'Zeit|f|Zeiten|2|x',
  'Name|m|Namen|2|w|G=Namens|x', 'Ding|n|Dinge|2|x', 'Sache|f|Sachen|2|x', 'Ort|m|Orte|3', 'Platz|m|Plätze|2',
  'Ecke|f|Ecken|3', 'Mitte|f|-|3|x', 'Ende|n|Enden|2|x', 'Anfang|m|Anfänge|3|x', 'Seite|f|Seiten|2', 'Linie|f|Linien|3',
  'Kreis|m|Kreise|2', 'Quadrat|n|Quadrate|3|G=Quadrats', 'Dreieck|n|Dreiecke|3|G=Dreiecks', 'Würfel|m|Würfel|2',
  'Karte|f|Karten|2', 'Schatz|m|Schätze|2', 'Preis|m|Preise|3|x', 'Wunsch|m|Wünsche|3|x', 'Plan|m|Pläne|3|x',
  'Nummer|f|Nummern|2', 'Gewinn|m|Gewinne|3|x', 'Rest|m|Reste|3|x', 'Stück|n|Stücke|2'
];
