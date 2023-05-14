"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chatbot_service_1 = require("service/chatbot-service");
require('dotenv').config();
var telegramToken = process.env.BOT_TOKEN || '';
(0, chatbot_service_1.setUpBot)(telegramToken);
