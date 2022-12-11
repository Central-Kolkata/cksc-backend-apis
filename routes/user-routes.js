const express = require("express");
const router = express.Router();
const { fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser, sendSMS } = require("../controllers/user-controller");

router.route(`/`).get(fetchUsers).post(createUser);
router.route(`/add`).post(createUsers);
router.route(`/modify/:id`).put(updateUser).delete(deleteUser);
router.route(`/fetchPendingAmount/:icaiMembershipNo`).get(fetchPendingAmount);
router.route(`/sendSMS`).post(sendSMS);

module.exports = router;
