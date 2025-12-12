const express = require("express");
const router = express.Router();
const {
	fetchMembers, fetchActiveMembers, checkCKSCMembershipNo, checkICAIMembershipNo, createMember, createMembers, fetchPendingAmount,
	updateMember, updateMultipleMembers, deleteMember, fetchRegisteredEvents, memberTransactions,
	asdf, replaceMembers, updateEventRegistration, removeEventRegistration } = require("../controllers/member-controller");

router.route(`/`).get(fetchMembers).post(createMember);
router.route(`/active`).get(fetchActiveMembers);
router.route(`/asdf`).get(asdf);
router.route(`/add`).post(createMembers);
router.route(`/checkCKSCMembershipNo/:ckscMembershipNo`).get(checkCKSCMembershipNo);
router.route(`/checkICAIMembershipNo/:icaiMembershipNo`).get(checkICAIMembershipNo);
router.route(`/replace`).post(replaceMembers);
router.route(`/modify/:id`).put(updateMember).delete(deleteMember);
router.route(`/update-multiple`).put(updateMultipleMembers);
router.route(`/fetchPendingAmount/:icaiMembershipNo`).get(fetchPendingAmount);
router.route(`/fetchPendingAmount/:icaiMembershipNo/:eventIdForRegistration`).get(fetchPendingAmount);
router.route(`/events/:memberId`).get(fetchRegisteredEvents);
router.route(`/:memberId/transactions`).get(memberTransactions);

router.route(`/:memberId/event/:eventId`).patch(updateEventRegistration);
router.route(`/:memberId/event/:eventId/remove`).patch(removeEventRegistration);

module.exports = router;
