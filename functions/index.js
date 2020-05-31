const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
const NodeGeocoder = require("node-geocoder");

admin.initializeApp();

const db = admin.firestore();

const geo = require("geofirex").init(admin);
const { get } = require("geofirex");

const options = {
  provider: "google",
  apiKey: functions.config().google.key,
};
const geocoder = NodeGeocoder(options);

app.get("/ew", async (req, res) => {
  const essentialWorkers = await db
    .collection("essentialWorkers")
    .limit(5)
    .get();
  let workers = [];
  essentialWorkers.forEach((doc) => {
    workers.push(doc.data());
  });
  return res.json(workers);
});

app.get("/donors", async (req, res) => {
  const donors = await db.collection("donors").limit(5).get();
  let workers = [];
  donors.forEach((doc) => {
    workers.push(doc.data());
  });
  return res.json(workers);
});

exports.geocodeNewEW = functions.firestore
  .document("essentialWorkers/{workerId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const coords = await createGeocode(data.zip);
    const position = geo.point(coords.latitude, coords.longitude);
    return snap.ref.update({ position });
  });

exports.geocodeNewDonors = functions.firestore
  .document("donors/{donorId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const coords = await createGeocode(data.zip);
    const position = geo.point(coords.latitude, coords.longitude);
    return snap.ref.update({ position });
  });

app.put("/ew/geopoint", async (req, res) => {
  const ew = await db.collection("essentialWorkers").get();
  ew.forEach(async (doc) => {
    const docData = doc.data();
    const geoPointExists = docData.position && docData.position.geohash;
    if (!geoPointExists) {
      const coords = await createGeocode(zip);
      const position = geo.point(coords.latitude, coords.longitude);
      return doc.ref.update({ position });
    } else return null;
  });
  return res.json("success");
});

async function createGeocode(zip) {
  try {
    const coordinates = await geocoder.geocode(zip);
    console.log(coordinates);
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
    };
  } catch (err) {
    console.log("err in creating geocode", err);
    return null;
  }
}

app.get("/ew/nearby", async (req, res) => {
  const zip = req.query.zip;
  const coords = await createGeocode(zip);
  const center = geo.point(coords.latitude, coords.longitude);
  const radius = 50;
  const field = "position";
  const query = geo.query("essentialWorkers").within(center, radius, field);
  const nearby = await get(query);
  return res.json(nearby);
});

exports.api = functions.https.onRequest(app);
