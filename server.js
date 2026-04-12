const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 TEMP STORAGE (later DB)
const otpStore = {};

// 📧 EMAIL CONFIG
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "otkt dnaj iqme skhi" // NOT normal password
  }
});

app.get("/", (req, res) => {
  res.send("OTP Server Running 🚀");
});

// ✅ SEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  // ✅ respond immediately
  res.json({ success: true });

  // 🔥 send email AFTER response
  try {
    await transporter.sendMail({
      from: "saikingfishr@gmail.com",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`
    });

    console.log("OTP sent:", otp);

  } catch (err) {
    console.error("Email failed:", err);
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