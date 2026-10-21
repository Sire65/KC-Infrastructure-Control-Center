// Kapitel 2.14: Feedback-Seite mit erfundenen Fragen (sonst meldet die Demo „Da hat in der App etwas nicht geklappt“)
export default (antw) => {
  antw.feedback_meins = {
    fragen: [
      { id: "gesamt", schritt: 1, t: "Wie gefällt dir die Club-App insgesamt?", optionen: ["😍 Sehr gut", "🙂 Gut", "😐 Geht so", "🙁 Nicht gut"] },
      { id: "bedienung", schritt: 1, t: "Wie kommst du mit der Bedienung zurecht?", optionen: ["👍 Gut", "🤔 Teils, teils", "😕 Schwierig"] },
    ],
    umgesetzt: [], antwort: null,
  };
};
