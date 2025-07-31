const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const bodyParser = require("body-parser");

router.post(
  "/",
  bodyParser.raw({ type: "application/json" }, webhookController.handleWebhook)
);

module.exports = router;
