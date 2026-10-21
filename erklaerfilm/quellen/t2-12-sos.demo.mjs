// Kapitel 2.12 SOS: „Wo bin ich?“ bekommt eine erfundene Adresse auf einem öffentlichen Platz (Marktplatz Werne) – keine Wohnadresse.
// Der Standort selbst kommt aus einem Schein-GPS im „vorher“ des Kapitels.
export default (antw) => {
  antw.sos_ort = () => ({ adresse: "Markt, 59368 Werne" });
};
