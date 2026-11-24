const db = require("../config/db");

const getAllOrders = async (req, res) => {
  try {
    const query = `
      SELECT
        o.id,
        o.customer_name AS customerName,
        o.customer_email AS customerEmail,
        o.customer_phone AS customerPhone,
        o.total_amount AS totalAmount,
        o.status,
        o.created_at AS createdAt,
        COUNT(oi.id) AS itemCount
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.id DESC
    `;

    const [results] = await db.promise().query(query);
    res.status(200).json(results);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const orderQuery = `
      SELECT
        id,
        customer_name AS customerName,
        customer_email AS customerEmail,
        customer_phone AS customerPhone,
        total_amount AS totalAmount,
        status,
        created_at AS createdAt
      FROM orders
      WHERE id = ?
    `;

    const itemsQuery = `
      SELECT
        oi.id,
        oi.order_id AS orderId,
        oi.product_id AS productId,
        p.name AS productName,
        p.sku,
        oi.quantity,
        oi.unit_price AS unitPrice,
        oi.subtotal
      FROM order_items oi
      INNER JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `;

    const [orderRows] = await db.promise().query(orderQuery, [id]);

    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [itemRows] = await db.promise().query(itemsQuery, [id]);

    res.status(200).json({
      ...orderRows[0],
      items: itemRows,
    });
  } catch (error) {
    console.error("Get order by id error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

const createOrder = async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    status = "pending",
    items,
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ message: "Customer fields are required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "At least one product is required" });
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Invalid product or quantity");
      }

      const [productRows] = await connection.query(
        `
          SELECT id, name, sku, price, quantity, low_stock_threshold AS lowStockThreshold
          FROM products
          WHERE id = ?
          FOR UPDATE
        `,
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error(`Product with id ${productId} not found`);
      }

      const product = productRows[0];

      if (product.quantity < quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      normalizedItems.push({
        productId,
        productName: product.name,
        quantity,
        unitPrice,
        subtotal,
      });
    }

    const [orderResult] = await connection.query(
      `
        INSERT INTO orders (
          customer_name,
          customer_email,
          customer_phone,
          total_amount,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [customerName, customerEmail, customerPhone, totalAmount, status]
    );

    const orderId = orderResult.insertId;

    for (const item of normalizedItems) {
      await connection.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, item.productId, item.quantity, item.unitPrice, item.subtotal]
      );

      await connection.query(
        `
          UPDATE products
          SET quantity = quantity - ?
          WHERE id = ?
        `,
        [item.quantity, item.productId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: orderId,
        customerName,
        customerEmail,
        customerPhone,
        totalAmount,
        status,
        items: normalizedItems,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create order error:", error);
    res.status(400).json({ message: error.message || "Failed to create order" });
  } finally {
    connection.release();
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { customerName, customerEmail, customerPhone, status } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingRows] = await db.promise().query(
      `SELECT id, total_amount AS totalAmount FROM orders WHERE id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    await db.promise().query(
      `
        UPDATE orders
        SET
          customer_name = ?,
          customer_email = ?,
          customer_phone = ?,
          status = ?
        WHERE id = ?
      `,
      [customerName, customerEmail, customerPhone, status, id]
    );

    res.status(200).json({
      message: "Order updated successfully",
      order: {
        id: Number(id),
        customerName,
        customerEmail,
        customerPhone,
        totalAmount: existingRows[0].totalAmount,
        status,
      },
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query(
      `SELECT id FROM orders WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const [itemRows] = await connection.query(
      `
        SELECT product_id AS productId, quantity
        FROM order_items
        WHERE order_id = ?
      `,
      [id]
    );

    for (const item of itemRows) {
      await connection.query(
        `
          UPDATE products
          SET quantity = quantity + ?
          WHERE id = ?
        `,
        [item.quantity, item.productId]
      );
    }

    await connection.query(`DELETE FROM orders WHERE id = ?`, [id]);

    await connection.commit();

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Failed to delete order" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};