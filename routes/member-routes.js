const express = require("express");
const router = express.Router();
const { fetchMembers, createMember, createMembers, fetchPendingAmount, updateMember, deleteMember, fetchRegisteredEvents, memberTransactions, asdf, replaceMembers } = require("../controllers/member-controller");

router.route(`/`).get(fetchMembers).post(createMember);
router.route(`/asdf`).get(asdf);
router.route(`/add`).post(createMembers);
router.route(`/replace`).post(replaceMembers);
router.route(`/modify/:id`).put(updateMember).delete(deleteMember);
router.route(`/fetchPendingAmount/:icaiMembershipNo`).get(fetchPendingAmount);
router.route(`/events/:memberId`).get(fetchRegisteredEvents);
router.route(`/:memberId/transactions`).get(memberTransactions);

module.exports = router;
