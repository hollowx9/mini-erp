const db = require("../config/db");

const getAllPayments = async (req, res) => {
  try {
    const query = `
      SELECT
        p.id,
        p.order_id AS orderId,
        o.customer_name AS customerName,
        p.amount,
        p.payment_method AS paymentMethod,
        p.payment_date AS paymentDate,
        p.note,
        p.created_at AS createdAt
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      ORDER BY p.id DESC
    `;

    const [results] = await db.promise().query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

const getFinanceSummary = async (req, res) => {
  try {
    const [totalRevenueRows] = await db.promise().query(`
      SELECT COALESCE(SUM(amount), 0) AS totalRevenue
      FROM payments
    `);

    const [paymentCountRows] = await db.promise().query(`
      SELECT COUNT(*) AS totalPayments
      FROM payments
    `);

    const [todayRevenueRows] = await db.promise().query(`
      SELECT COALESCE(SUM(amount), 0) AS todayRevenue
      FROM payments
      WHERE payment_date = CURDATE()
    `);

    const [pendingOrdersRows] = await db.promise().query(`
      SELECT COUNT(*) AS pendingOrders
      FROM orders
      WHERE status = 'pending'
    `);

    res.status(200).json({
      totalRevenue: totalRevenueRows[0].totalRevenue || 0,
      totalPayments: paymentCountRows[0].totalPayments || 0,
      todayRevenue: todayRevenueRows[0].todayRevenue || 0,
      pendingOrders: pendingOrdersRows[0].pendingOrders || 0,
    });
  } catch (error) {
    console.error("Finance summary error:", error);
    res.status(500).json({ message: "Failed to fetch finance summary" });
  }
};

const createPayment = async (req, res) => {
  const { orderId, amount, paymentMethod, paymentDate, note } = req.body;

  if (!orderId || !amount || !paymentMethod || !paymentDate) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query(
      `
        SELECT id, total_amount AS totalAmount, status
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderRows[0];

    const [paymentSumRows] = await connection.query(
      `
        SELECT COALESCE(SUM(amount), 0) AS paidAmount
        FROM payments
        WHERE order_id = ?
      `,
      [orderId]
    );

    const currentPaid = Number(paymentSumRows[0].paidAmount || 0);
    const newAmount = Number(amount);
    const orderTotal = Number(order.totalAmount);

    if (newAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (currentPaid + newAmount > orderTotal) {
      await connection.rollback();
      return res.status(400).json({
        message: `Payment exceeds remaining balance. Remaining: ${(orderTotal - currentPaid).toFixed(2)}`,
      });
    }

    const [insertResult] = await connection.query(
      `
        INSERT INTO payments (
          order_id,
          amount,
          payment_method,
          payment_date,
          note
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [orderId, newAmount, paymentMethod, paymentDate, note || null]
    );

    const updatedPaid = currentPaid + newAmount;
    let newStatus = order.status;

    if (updatedPaid === orderTotal) {
      newStatus = "paid";
    } else if (updatedPaid > 0 && updatedPaid < orderTotal) {
      newStatus = "pending";
    }

    await connection.query(
      `
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `,
      [newStatus, orderId]
    );

    await connection.commit();

    res.status(201).json({
      message: "Payment created successfully",
      payment: {
        id: insertResult.insertId,
        orderId,
        amount: newAmount,
        paymentMethod,
        paymentDate,
        note: note || "",
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Failed to create payment" });
  } finally {
    connection.release();
  }
};

const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, paymentDate, note } = req.body;

  if (!amount || !paymentMethod || !paymentDate) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [paymentRows] = await connection.query(
      `
        SELECT id, order_id AS orderId
        FROM payments
        WHERE id = ?
        FOR UPDATE
      `,
      [id]
    );

    if (paymentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentRows[0];

    const [orderRows] = await connection.query(
      `
        SELECT id, total_amount AS totalAmount
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [payment.orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Related order not found" });
    }

    const orderTotal = Number(orderRows[0].totalAmount);

    const [otherPaymentsRows] = await connection.query(
      `
        SELECT COALESCE(SUM(amount), 0) AS otherPaid
        FROM payments
        WHERE order_id = ? AND id != ?
      `,
      [payment.orderId, id]
    );

    const otherPaid = Number(otherPaymentsRows[0].otherPaid || 0);
    const newAmount = Number(amount);

    if (newAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (otherPaid + newAmount > orderTotal) {
      await connection.rollback();
      return res.status(400).json({
        message: `Payment exceeds remaining balance. Remaining: ${(orderTotal - otherPaid).toFixed(2)}`,
      });
    }

    await connection.query(
      `
        UPDATE payments
        SET amount = ?, payment_method = ?, payment_date = ?, note = ?
        WHERE id = ?
      `,
      [newAmount, paymentMethod, paymentDate, note || null, id]
    );

    const totalPaid = otherPaid + newAmount;
    let newStatus = "pending";

    if (totalPaid === orderTotal) {
      newStatus = "paid";
    }

    await connection.query(
      `
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `,
      [newStatus, payment.orderId]
    );

    await connection.commit();

    res.status(200).json({
      message: "Payment updated successfully",
      payment: {
        id: Number(id),
        orderId: payment.orderId,
        amount: newAmount,
        paymentMethod,
        paymentDate,
        note: note || "",
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update payment error:", error);
    res.status(500).json({ message: "Failed to update payment" });
  } finally {
    connection.release();
  }
};

const deletePayment = async (req, res) => {
  const { id } = req.params;

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [paymentRows] = await connection.query(
      `
        SELECT id, order_id AS orderId
        FROM payments
        WHERE id = ?
        FOR UPDATE
      `,
      [id]
    );

    if (paymentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentRows[0];

    await connection.query(`DELETE FROM payments WHERE id = ?`, [id]);

    const [orderRows] = await connection.query(
      `
        SELECT total_amount AS totalAmount
        FROM orders
        WHERE id = ?
        FOR UPDATE
      `,
      [payment.orderId]
    );

    if (orderRows.length > 0) {
      const orderTotal = Number(orderRows[0].totalAmount);

      const [paymentSumRows] = await connection.query(
        `
          SELECT COALESCE(SUM(amount), 0) AS paidAmount
          FROM payments
          WHERE order_id = ?
        `,
        [payment.orderId]
      );

      const paidAmount = Number(paymentSumRows[0].paidAmount || 0);
      const newStatus = paidAmount === orderTotal ? "paid" : "pending";

      await connection.query(
        `
          UPDATE orders
          SET status = ?
          WHERE id = ?
        `,
        [newStatus, payment.orderId]
      );
    }

    await connection.commit();

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete payment error:", error);
    res.status(500).json({ message: "Failed to delete payment" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllPayments,
  getFinanceSummary,
  createPayment,
  updatePayment,
  deletePayment,
};