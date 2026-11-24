const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: rememberMe ? "30d" : "7d",
      }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const register = async (req, res) => {
  const { name, email, password, phone, position } = req.body;

  if (!name || !email || !password || !phone || !position) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'user')
      `,
      [name, email, hashedPassword]
    );

    const userId = userResult.insertId;

    await connection.query(
      `
      INSERT INTO employees (id, full_name, email, phone, position, salary)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [userId, name, email, phone, position, 0]
    );

    await connection.commit();

    res.status(201).json({
      message: "Account created successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Register error:", error);
    res.status(500).json({ message: "Failed to create account" });
  } finally {
    connection.release();
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const [users] = await db.promise().query(
      "SELECT id, email, name FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent",
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await db.promise().query(
      `
      UPDATE password_resets
      SET used = true
      WHERE user_id = ? AND used = false
      `,
      [user.id]
    );

    await db.promise().query(
      `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
      `,
      [user.id, resetToken, expiresAt]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Mini ERP" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your Mini ERP password",
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    res.status(200).json({
      message: "If this email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must contain at least 6 characters",
    });
  }

  try {
    const [resets] = await db.promise().query(
      `
      SELECT *
      FROM password_resets
      WHERE token = ? AND used = false AND expires_at > NOW()
      `,
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const reset = resets[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query(
      `
      UPDATE users
      SET password = ?
      WHERE id = ?
      `,
      [hashedPassword, reset.user_id]
    );

    await db.promise().query(
      `
      UPDATE password_resets
      SET used = true
      WHERE id = ?
      `,
      [reset.id]
    );

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
};