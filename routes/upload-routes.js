const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/upload-controller");
const upload = require("../config/multer-config");

router.post('/uploadFile', upload.single('file'), uploadFile);

module.exports = router;
