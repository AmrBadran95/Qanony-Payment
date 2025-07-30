const express = require("express");
const router = express.Router();
const { createSetupIntent } = require("../controllers/setupIntentController");

router.post("/create-setup-intent", createSetupIntent);

module.exports = router;
