const express = require("express");
const router = express.Router();
const { fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser, fetchUserTransactions } = require("../controllers/user-controller");

router.route(`/`).get(fetchUsers).post(createUser);
router.route(`/add`).post(createUsers);
router.route(`/modify/:id`).put(updateUser).delete(deleteUser);
router.route(`/fetchTransactions`).get(fetchUserTransactions);
router.route(`/fetchPendingAmount/:icaiMembershipNo`).get(fetchPendingAmount);

module.exports = router;
