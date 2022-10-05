const express = require("express");
const router = express.Router();
const { fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser } = require("../controllers/user-controller");

router.route(`/`).get(fetchUsers).post(createUser);
router.route(`/createUsers`).post(createUsers);
router.route(`/:id`).put(updateUser).delete(deleteUser);
router.route(`/fetchPendingAmount/:membershipNo`).get(fetchPendingAmount);

module.exports = router;
