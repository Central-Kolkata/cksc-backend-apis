const express = require("express");
const router = express.Router();
const { fetchUsers, createUser, updateUser, deleteUser } = require("../controllers/user-controller");

router.route(`/`).get(fetchUsers).post(createUser);
router.route(`/:id`).put(updateUser).delete(deleteUser);

module.exports = router;
