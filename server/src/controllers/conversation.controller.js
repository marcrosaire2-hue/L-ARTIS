const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const conversationService = require('../services/conversation.service');

const open = catchAsync(async (req, res) => {
  const data = await conversationService.openConversation(req.user._id, req.body);
  res.status(201).json(ApiResponse.created('Conversation ouverte', data));
});

const list = catchAsync(async (req, res) => {
  const data = await conversationService.listConversations(req.user._id, req.query);
  res.json(ApiResponse.ok('Conversations', data));
});

const getOne = catchAsync(async (req, res) => {
  const data = await conversationService.getConversation(req.params.id, req.user._id);
  res.json(ApiResponse.ok('Conversation', data));
});

const listMessages = catchAsync(async (req, res) => {
  const data = await conversationService.listMessages(req.params.id, req.user._id, req.query);
  res.json(ApiResponse.ok('Messages', data));
});

const sendMessage = catchAsync(async (req, res) => {
  const data = await conversationService.sendMessage(req.params.id, req.user._id, req.body);
  res.status(201).json(ApiResponse.created('Message envoyé', data));
});

module.exports = { open, list, getOne, listMessages, sendMessage };
