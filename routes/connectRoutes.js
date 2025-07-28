const express = require("express");
const router = express.Router();
const { createConnectAccount } = require("../controllers/connectController");

router.post("/create-connect-account", createConnectAccount);

module.exports = router;
