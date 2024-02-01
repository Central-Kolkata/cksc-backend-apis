const express = require("express");
const router = express.Router();
const { fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser, fetchRegisteredEvents, userTransactions } = require("../controllers/user-controller");

router.route(`/`).get(fetchUsers).post(createUser);
router.route(`/add`).post(createUsers);
router.route(`/modify/:id`).put(updateUser).delete(deleteUser);
router.route(`/fetchPendingAmount/:icaiMembershipNo`).get(fetchPendingAmount);
router.route(`/events/:userId`).get(fetchRegisteredEvents);
router.route(`/:userId/transactions`).get(userTransactions);

module.exports = router;
