// Kapitel 2.8: Max hat einen Geburtstag hinterlegt (sonst zeigt die Privatsphäre den Hinweis „kein Geburtstag hinterlegt“)
export default (antw) => { antw.init = { ...antw.init, hatGeburtstag: true }; };
