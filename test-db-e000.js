const mongoose = require("mongoose");
const MemberPayment = require("./models/member-payment");

async function check() {
  await mongoose.connect("mongodb+srv://db-admin-of-cksc:iPiExZba43Cqaq6f@cksc.lh5ni5d.mongodb.net/CKSC-ADMIN?retryWrites=true&w=majority");

  const payments = await MemberPayment.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $lookup: { from: "icicipaymentresponses", localField: "iciciPaymentResponseId", foreignField: "_id", as: "resp" } },
    { $addFields: { resp: { $arrayElemAt: ["$resp", 0] } } },
    { $group: { _id: "$resp.responseCode", count: { $sum: 1 } } }
  ]);
  console.log("Code breakdown:", payments);
  process.exit(0);
}

check().catch(console.error);
