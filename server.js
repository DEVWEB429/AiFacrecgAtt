const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 🔥 TEMP STORAGE (use Redis/DB in production)
const otpStore = {};

// ===============================
// ROOT
// ===============================
app.get("/", (req, res) => {
  res.send("OTP Server Running 🚀");
});

// ===============================
// SEND OTP
// ===============================
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📩 Request received for:", email);

  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  // 🔐 Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  console.log("🔐 Generated OTP:", otp);

  // ✅ Respond immediately
  res.json({ success: true });

  // 📧 Send email in background
  setImmediate(async () => {
    try {
      console.log("🚀 Sending email via SendGrid...");

      const msg = {
        to: email,
        from: "saikingfishr@gmail.com", // must be verified in SendGrid
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
        html: `
          <div style="font-family: Arial; text-align:center;">
            <h2>🔐 Your OTP Code</h2>
            <h1 style="color:#2c7be5;">${otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          </div>
        `
      };

      await sgMail.send(msg);

      console.log("✅ EMAIL SENT");

    } catch (err) {
      console.error("❌ EMAIL FAILED:", err.response?.body || err.message);
      console.log("⚠️ OTP (fallback):", otp);
    }
  });
});

// ===============================
// VERIFY OTP
// ===============================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) return res.json({ success: false });

  if (record.otp === otp && record.expires > Date.now()) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// ===============================
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});