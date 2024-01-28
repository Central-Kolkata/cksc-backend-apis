const express = require("express");
const router = express.Router();
const { fetchVenues, createVenue, updateVenue, deleteVenue } = require("../controllers/event-controller");

router.route(`/venues`).get(fetchVenues);
router.route(`/venues/add`).post(createVenue);
router.route(`/venues/modify/:id`).put(updateVenue).delete(deleteVenue);

module.exports = router;
