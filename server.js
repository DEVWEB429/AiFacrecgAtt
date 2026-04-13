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

// ✅ IPv4 FORCE
const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4 }, callback);
};

// ✅ FIXED transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "saikingfishr@gmail.com",
    pass: "otktdnajiqmeskhi"
  },
  tls: {
    rejectUnauthorized: false
  },
  lookup: ipv4Lookup
});

app.get("/", (req, res) => {
  res.send("OTP Server Running 🚀");
});

// ✅ SEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  console.log("📩 Request received for:", email);

  if (!email) {
    console.log("❌ No email provided");
    return res.status(400).json({ success: false, error: "Email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  console.log("🔐 Generated OTP:", otp);

  try {
    console.log("🚀 Sending email via IPv4...");

    const info = await transporter.sendMail({
      from: `"FaceRecgAI" <saikingfishr@gmail.com>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<h2>Your OTP is: ${otp}</h2>`
    });

    console.log("✅ MAIL SENT SUCCESSFULLY");
    console.log("📨 SMTP RESPONSE:", info.response);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ EMAIL FAILED");
    console.error("Error message:", err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
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