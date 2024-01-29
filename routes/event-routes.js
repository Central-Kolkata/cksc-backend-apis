const express = require("express");
const router = express.Router();
const { fetchVenues, createVenue, updateVenue, deleteVenue, fetchEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/event-controller");

router.route(`/venues`).get(fetchVenues);
router.route(`/venues/add`).post(createVenue);
router.route(`/venues/modify/:id`).put(updateVenue).delete(deleteVenue);

router.route(`/`).get(fetchEvents);
router.route(`/add`).post(createEvent);
router.route(`/modify/:id`).put(updateEvent).delete(deleteEvent);

module.exports = router;
