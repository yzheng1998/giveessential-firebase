const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.getEssentialWorkers = functions.https.onRequest((req, res) => {
  admin
    .firestore()
    .collection("essentialWorkers")
    .get()
    .then((data) => {
      let workers = [];
      data.forEach((doc) => {
        workers.push(doc.data());
      });
      return res.json(workers);
    })
    .catch((err) => console.error(err));
});
