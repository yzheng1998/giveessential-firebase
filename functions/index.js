const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
const NodeGeocoder = require("node-geocoder");

admin.initializeApp();

const db = admin.firestore();

const options = {
  provider: "google",
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
};
const geocoder = NodeGeocoder(options);

app.get("/getEssentialWorkers", (req, res) => {
  db.collection("essentialWorkers")
    .limit(15)
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

app.get("/getDonors", (req, res) => {
  db.collection("Donors")
    .limit(15)
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

exports.geocodeEssentialWorkers = functions.firestore
  .document("essentialWorkers/{workerId}")
  .onCreate(async (snap, context) => {
    const workerId = context.params.workerId;
    console.log("workerId: ", workerId);
    const data = snap.data();
    console.log("snap.val: ", data);
    const coordinates = await createGeocode(data.zip);
    console.log("coordinates: ", coordinates);
    return snap.ref.update({ coordinates: coordinates });
  });

exports.geocodeDonors = functions.firestore
  .document("donors/{donorId}")
  .onCreate(async (snap, context) => {
    const donorId = context.params.workerId;
    console.log("donorId: ", donorId);
    const data = snap.data();
    console.log("snap.val: ", data);
    const coordinates = await createGeocode(data.zip);
    console.log("coordinates: ", coordinates);
    return snap.ref.update({ coordinates: coordinates });
  });

app.get("/getCoordinatesEssentialWorkers", (req, res) => {
  db.collection("essentialWorkers")
    .get()
    .then((data) => {
      data.forEach(async (doc) => {
        const docData = doc.data();
        const zip = docData.zip || null;
        const coordData =
          docData.coordinates && docData.coordinates.latitude
            ? docData.coordinates
            : null;
        try {
          if (coordData === null) {
            console.log("doc.id: ", doc.id);
            console.log("zip: ", zip);
            console.log("pre", docData.coordinates);
            const coordinates = await createGeocode(zip);
            console.log("post", coordinates);
            return doc.ref.update({ coordinates: coordinates });
          }
          return null;
        } catch (err) {
          return err;
        }
      });
      return "success";
    })
    .catch((err) => console.log(err));
});

app.get("/getCoordinatesDonors", (req, res) => {
  db.collection("donors")
    .get()
    .then((data) => {
      data.forEach(async (doc) => {
        const docData = doc.data();
        const zip = docData.zip || null;
        const coordData =
          docData.coordinates && docData.coordinates.latitude
            ? docData.coordinates
            : null;
        try {
          if (coordData === null) {
            console.log("doc.id: ", doc.id);
            console.log("zip: ", zip);
            console.log("pre", docData.coordinates);
            const coordinates = await createGeocode(zip);
            console.log("post", coordinates);
            return doc.ref.update({ coordinates: coordinates });
          }
          return null;
        } catch (err) {
          return err;
        }
      });
      return "success";
    })
    .catch((err) => console.log(err));
});

async function createGeocode(zip) {
  try {
    const coordinates = await geocoder.geocode(zip);
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
    };
  } catch (err) {
    return null;
  }
}

exports.api = functions.https.onRequest(app);
