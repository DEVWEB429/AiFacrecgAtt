const express = require("express");
const cors = require("cors");
const dns = require("dns");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 TEMP STORAGE (later DB)
const otpStore = {};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // 🔥 CHANGE FROM 465 → 587
  secure: false, // TLS upgrade (more stable)
  auth: {
    user: "saikingfishr@gmail.com",
    pass: "otktdnajiqmeskhi"
  },
  requireTLS: true,
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2"
  },
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,

  // 🔥 FORCE IPv4 HARD
  lookup: (hostname, options, callback) => {
    return dns.lookup(hostname, { family: 4, all: false }, callback);
  }
});

app.get("/", (req, res) => {
  res.send("OTP Server Running 🚀");
});

// ✅ SEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📩 Request received for:", email);

  if (!email) {
    console.log("❌ Missing email");
    return res.status(400).json({ success: false, error: "Email required" });
  }

  // 🔐 Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  };

  console.log("🔐 Generated OTP:", otp);

  // ✅ ALWAYS respond immediately (avoid Android timeout)
  res.json({ success: true });

  // 🔥 Send email in background (non-blocking)
  setImmediate(async () => {
    try {
      console.log("🚀 Sending email (background)...");

      const info = await transporter.sendMail({
        from: `"FaceRecgAI" <saikingfishr@gmail.com>`,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
        html: `
          <div style="font-family: Arial; text-align:center;">
            <h2>🔐 Your OTP Code</h2>
            <h1 style="color:#2c7be5;">${otp}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          </div>
        `
      });

      console.log("✅ MAIL SENT:", info.response);

    } catch (err) {
      console.error("❌ EMAIL FAILED:", err.message);

      // 🔥 fallback (important for debugging)
      console.log("⚠️ OTP (fallback):", otp);
    }
  });
});

// ✅ VERIFY OTP
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


app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});