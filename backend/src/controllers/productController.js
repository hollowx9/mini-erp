const db = require("../config/db");

const getAllProducts = (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      sku,
      price,
      quantity,
      low_stock_threshold AS lowStockThreshold,
      created_at AS createdAt
    FROM products
    ORDER BY id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Get products error:", err);

      return res.status(500).json({
        message: "Failed to fetch products",
      });
    }

    res.status(200).json(results);
  });
};

const createProduct = (req, res) => {
  const {
    name,
    sku,
    price,
    quantity,
    lowStockThreshold,
  } = req.body;

  if (!name || !sku || price === undefined) {
    return res.status(400).json({
      message: "Name, SKU and price required",
    });
  }

  const productPrice = Number(price);

  const productQuantity =
    quantity === "" || quantity === undefined
      ? 0
      : Number(quantity);

  const productLowStock =
    lowStockThreshold === "" ||
    lowStockThreshold === undefined
      ? 5
      : Number(lowStockThreshold);

  if (isNaN(productPrice)) {
    return res.status(400).json({
      message: "Invalid price",
    });
  }

  const query = `
    INSERT INTO products (
      name,
      sku,
      price,
      quantity,
      low_stock_threshold
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      name,
      sku,
      productPrice,
      productQuantity,
      productLowStock,
    ],
    (err, result) => {
      if (err) {
        console.error("Create product error:", err);

        return res.status(500).json({
          message: "Failed to create product",
        });
      }

      res.status(201).json({
        message: "Product created",
        product: {
          id: result.insertId,
          name,
          sku,
          price: productPrice,
          quantity: productQuantity,
          lowStockThreshold: productLowStock,
        },
      });
    }
  );
};

const updateProduct = (req, res) => {
  const { id } = req.params;

  const {
    name,
    sku,
    price,
    quantity,
    lowStockThreshold,
  } = req.body;

  const productPrice = Number(price);

  const productQuantity =
    quantity === "" || quantity === undefined
      ? 0
      : Number(quantity);

  const productLowStock =
    lowStockThreshold === "" ||
    lowStockThreshold === undefined
      ? 5
      : Number(lowStockThreshold);

  const query = `
    UPDATE products
    SET
      name = ?,
      sku = ?,
      price = ?,
      quantity = ?,
      low_stock_threshold = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [
      name,
      sku,
      productPrice,
      productQuantity,
      productLowStock,
      id,
    ],
    (err) => {
      if (err) {
        console.error("Update product error:", err);

        return res.status(500).json({
          message: "Failed to update product",
        });
      }

      res.status(200).json({
        message: "Product updated",
      });
    }
  );
};

const deleteProduct = (req, res) => {
  const { id } = req.params;

  const query = `
    DELETE FROM products
    WHERE id = ?
  `;

  db.query(query, [id], (err) => {
    if (err) {
      console.error("Delete product error:", err);

      return res.status(500).json({
        message: "Failed to delete product",
      });
    }

    res.status(200).json({
      message: "Product deleted",
    });
  });
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};