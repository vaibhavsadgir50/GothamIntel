import { Router } from "express";
import { getDb, saveDb, Conversation, ChatMessageRecord } from "./db";
import { AuthedRequest, requireAuth } from "./authMiddleware";

const router = Router();

router.use(requireAuth);

// GET /api/messages — list conversations for current user
router.get("/", (req: AuthedRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const conversations = db.conversations
    .filter((c) => c.hostId === userId || c.seekerId === userId)
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

  res.json(conversations);
});

// GET /api/messages/:conversationId — messages in a thread
router.get("/:conversationId", (req: AuthedRequest, res) => {
  const db = getDb();
  const conversation = db.conversations.find((c) => c.id === req.params.conversationId);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const userId = req.user!.id;
  if (conversation.hostId !== userId && conversation.seekerId !== userId) {
    return res.status(403).json({ error: "Not a participant in this conversation" });
  }

  const messages = db.messages
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  res.json({ conversation, messages });
});

// POST /api/messages — send a message (creates conversation if needed)
router.post("/", (req: AuthedRequest, res) => {
  try {
    const { conversationId, listingId, inquiryId, recipientId, text } = req.body;
    const cleanText = String(text || "").trim();
    if (!cleanText) return res.status(400).json({ error: "Message text is required" });

    const db = getDb();
    const sender = req.user!;
    let conversation: Conversation | undefined;

    if (conversationId) {
      conversation = db.conversations.find((c) => c.id === conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.hostId !== sender.id && conversation.seekerId !== sender.id) {
        return res.status(403).json({ error: "Not a participant" });
      }
    } else if (inquiryId) {
      const inquiry = db.inquiries.find((i) => i.id === inquiryId);
      if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
      if (inquiry.hostId !== sender.id && inquiry.seekerId !== sender.id) {
        return res.status(403).json({ error: "Not a participant on this inquiry" });
      }

      conversation = db.conversations.find((c) => c.inquiryId === inquiryId);
      if (!conversation) {
        const host = db.users.find((u) => u.id === inquiry.hostId);
        const seeker = db.users.find((u) => u.id === inquiry.seekerId);
        conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          listingId: inquiry.listingId,
          listingTitle: inquiry.listingTitle,
          inquiryId: inquiry.id,
          hostId: inquiry.hostId,
          hostName: host?.name || "Host",
          seekerId: inquiry.seekerId,
          seekerName: seeker?.name || "Seeker",
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: cleanText,
        };
        db.conversations.push(conversation);
        inquiry.conversationId = conversation.id;
      }
    } else if (listingId && recipientId) {
      const listing = db.listings.find((l) => l.id === listingId);
      if (!listing) return res.status(404).json({ error: "Listing not found" });

      const hostId = listing.hostId;
      const seekerId = sender.role === "seeker" ? sender.id : recipientId;
      const actualHostId = sender.role === "host" ? sender.id : hostId;

      conversation = db.conversations.find(
        (c) => c.listingId === listingId && c.hostId === actualHostId && c.seekerId === seekerId
      );

      if (!conversation) {
        const host = db.users.find((u) => u.id === actualHostId);
        const seeker = db.users.find((u) => u.id === seekerId);
        conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          listingId,
          listingTitle: listing.title,
          hostId: actualHostId,
          hostName: host?.name || "Host",
          seekerId,
          seekerName: seeker?.name || "Seeker",
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: cleanText,
        };
        db.conversations.push(conversation);
      }
    } else {
      return res.status(400).json({
        error: "Provide conversationId, or inquiryId, or listingId + recipientId",
      });
    }

    const message: ChatMessageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      conversationId: conversation.id,
      senderId: sender.id,
      senderRole: sender.role,
      senderName: sender.name,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = cleanText.slice(0, 120);
    db.messages.push(message);
    saveDb(db);

    res.status(201).json({ conversation, message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
