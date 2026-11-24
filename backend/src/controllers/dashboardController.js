const db = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const [employees] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM employees"
    );

    const [products] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM products"
    );

    const [orders] = await db.promise().query(
      "SELECT COUNT(*) AS count FROM orders"
    );

    const [revenue] = await db.promise().query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
    `);

    const [lowStock] = await db.promise().query(`
      SELECT COUNT(*) AS count
      FROM products
      WHERE quantity <= low_stock_threshold
    `);

    res.status(200).json({
      employees: employees[0].count,
      products: products[0].count,
      orders: orders[0].count,
      revenue: revenue[0].total,
      lowStock: lowStock[0].count,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const [revenueData] = await db.promise().query(`
      SELECT 
        DATE(payment_date) AS date,
        SUM(amount) AS total
      FROM payments
      GROUP BY DATE(payment_date)
      ORDER BY date ASC
      LIMIT 7
    `);

    const [ordersData] = await db.promise().query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS total
      FROM orders
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 7
    `);

    res.status(200).json({
      revenue: revenueData,
      orders: ordersData,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

const getRecentOrders = async (req, res) => {
  try {
    const [recentOrders] = await db.promise().query(`
      SELECT
        o.id,
        o.customer_name AS customerName,
        o.total_amount AS totalAmount,
        o.status,
        COALESCE(SUM(p.amount), 0) AS paidAmount,
        (o.total_amount - COALESCE(SUM(p.amount), 0)) AS remainingAmount,
        o.created_at AS createdAt
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.status(200).json(recentOrders);
  } catch (error) {
    console.error("Recent orders error:", error);
    res.status(500).json({ message: "Failed to load recent orders" });
  }
};

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getRecentOrders,
};