const mongoose = require("mongoose");
const MemberPayment = require("./models/member-payment");

async function check() {
  await mongoose.connect("mongodb+srv://db-admin-of-cksc:iPiExZba43Cqaq6f@cksc.lh5ni5d.mongodb.net/CKSC-ADMIN?retryWrites=true&w=majority");

  const start = new Date("2026-03-05");
  const end = new Date("2026-03-06");
  end.setHours(23, 59, 59, 999);

  console.log("Looking from", start, "to", end);

  const raw = await MemberPayment.find({ 
    createdAt: { $gte: start, $lte: end }
  }).lean();
  
  console.log(`Found ${raw.length} MemberPayment records in this date range.`);
  
  if (raw.length > 0) {
    console.log("Sample:", raw[0]);
    
    // Now check if paymentStatus is "paid"
    const paid = raw.filter(p => p.paymentStatus === "paid");
    console.log(`Of those, ${paid.length} are marked 'paid'`);

    if (paid.length > 0) {
      // test the aggregation pipeline locally to see where it drops
      const payments = await MemberPayment.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: "members",
            localField: "memberId",
            foreignField: "_id",
            as: "member"
          }
        },
        {
          $unwind: {
            path: "$member",
            preserveNullAndEmptyArrays: false
          }
        },
        { $match: { "member.status": "active" } }
      ]);
      console.log(`After member lookup and active status match: ${payments.length}`);
    }
  }

  process.exit(0);
}

check().catch(console.error);
