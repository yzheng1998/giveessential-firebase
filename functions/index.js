const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");

admin.initializeApp();
const app = express();

app.get("/getEssentialWorkers", (req, res) => {
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

exports.api = functions.https.onRequest(app);
