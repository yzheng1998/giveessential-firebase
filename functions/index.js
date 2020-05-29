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

app.get("/getEssentialWorkers", async (req, res) => {
  const essentialWorkers = await db
    .collection("essentialWorkers")
    .limit(15)
    .get();
  let workers = [];
  essentialWorkers.forEach((doc) => {
    workers.push(doc.data());
  });
  return res.json(workers);
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

app.put("/updateCoordinatesEssentialWorkers", (req, res) => {
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
      return res.json("success");
    })
    .catch((err) => console.log(err));
});

app.put("/updateCoordinatesDonors", (req, res) => {
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
      return res.json("success");
    })
    .catch((err) => console.log(err));
});

app.put("/updateGeoPointEssentialWorkers", (req, res) => {
  db.collection("essentialWorkers")
    .get()
    .then((data) => {
      data.forEach(async (doc) => {
        const docData = doc.data();
        const coords = docData.coordinates || null;
        const geoPointData =
          docData.position && docData.position.geohash
            ? docData.position
            : null;
        try {
          if (geoPointData === null) {
            console.log("doc.id: ", doc.id);
            console.log("coords: ", coords);
            const position = geo.point(coords.latitude, coords.longitude);
            console.log("position", position);
            return doc.ref.update({ position });
          }
          return null;
        } catch (err) {
          return err;
        }
      });
      return res.json("success");
    })
    .catch((err) => console.log(err));
});

app.put("/updateGeoPointDonors", (req, res) => {
  db.collection("donors")
    .get()
    .then((data) => {
      data.forEach(async (doc) => {
        const docData = doc.data();
        const coords = docData.coordinates || null;
        const geoPointData =
          docData.position && docData.position.geohash
            ? docData.position
            : null;
        try {
          if (geoPointData === null) {
            console.log("doc.id: ", doc.id);
            console.log("coords: ", coords);
            const position = geo.point(coords.latitude, coords.longitude);
            console.log("position", position);
            return doc.ref.update({ position });
          }
          return null;
        } catch (err) {
          return err;
        }
      });
      return res.json("success");
    })
    .catch((err) => console.log(err));
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

app.get("/getNearbyEW", async (req, res) => {
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
