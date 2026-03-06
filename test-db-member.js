const mongoose = require("mongoose");
const Member = require("./models/member-model");

async function check() {
  await mongoose.connect("mongodb+srv://db-admin-of-cksc:iPiExZba43Cqaq6f@cksc.lh5ni5d.mongodb.net/CKSC-ADMIN?retryWrites=true&w=majority");

  const member = await Member.findById("69aa83b4a6b345c0e08b6f18");
  console.log("Member found:", member);
  process.exit(0);
}

check().catch(console.error);
