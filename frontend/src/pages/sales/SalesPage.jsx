import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
} from "../../services/orderService";
import { getProducts } from "../../services/productService";
import { generateInvoicePdf } from "../../utils/generateInvoicePdf";

function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    status: "pending",
    items: [
      {
        productId: "",
        quantity: 1,
      },
    ],
  });

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(Number(product.id), product);
    });
    return map;
  }, [products]);

  const computedTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const product = productMap.get(Number(item.productId));
      if (!product) return sum;
      return sum + Number(product.price) * Number(item.quantity || 0);
    }, 0);
  }, [formData.items, productMap]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1 }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => {
      if (prev.items.length === 1) {
        return prev;
      }

      const updatedItems = prev.items.filter((_, i) => i !== index);

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const validateForm = () => {
    const { customerName, customerEmail, customerPhone, status, items } =
      formData;

    if (!customerName || !customerEmail || !customerPhone || !status) {
      toast.warning("Please fill in all customer fields");
      return false;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(customerEmail)) {
      toast.warning("Please enter a valid email");
      return false;
    }

    if (customerName.trim().length < 3) {
      toast.warning("Customer name must contain at least 3 characters");
      return false;
    }

    if (customerPhone.trim().length < 6) {
      toast.warning("Customer phone is too short");
      return false;
    }

    if (!items.length) {
      toast.warning("Add at least one product");
      return false;
    }

    for (const item of items) {
      if (!item.productId || Number(item.quantity) <= 0) {
        toast.warning("Each order item must have a product and valid quantity");
        return false;
      }

      const product = productMap.get(Number(item.productId));
      if (!product) {
        toast.warning("One selected product is invalid");
        return false;
      }

      if (!editId && Number(item.quantity) > Number(product.quantity)) {
        toast.warning(`Insufficient stock for ${product.name}`);
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      items: [
        {
          productId: "",
          quantity: 1,
        },
      ],
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editId) {
        await updateOrder(editId, {
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          status: formData.status,
        });
        toast.success("Order updated successfully");
      } else {
        await createOrder(formData);
        toast.success("Order created successfully");
      }

      resetForm();
      fetchOrders();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = async (order) => {
    try {
      const fullOrder = await getOrderById(order.id);

      setFormData({
        customerName: fullOrder.customerName,
        customerEmail: fullOrder.customerEmail,
        customerPhone: fullOrder.customerPhone,
        status: fullOrder.status,
        items:
          fullOrder.items?.length > 0
            ? fullOrder.items.map((item) => ({
                productId: String(item.productId),
                quantity: item.quantity,
              }))
            : [{ productId: "", quantity: 1 }],
      });

      setEditId(order.id);
      setViewOrder(fullOrder);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order details");
    }
  };

  const handleView = async (orderId) => {
    try {
      const fullOrder = await getOrderById(orderId);
      setViewOrder(fullOrder);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order details");
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const fullOrder = await getOrderById(orderId);
      generateInvoicePdf(fullOrder);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice");
    }
  };

  const openDeleteModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;

    try {
      await deleteOrder(selectedOrder.id);
      toast.success("Order deleted successfully");

      if (editId === selectedOrder.id) {
        resetForm();
      }

      if (viewOrder?.id === selectedOrder.id) {
        setViewOrder(null);
      }

      fetchOrders();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete order");
    } finally {
      setIsModalOpen(false);
      setSelectedOrder(null);
    }
  };

  return (
    <div className="sales-page">
      <h2>Sales</h2>

      <form className="sales-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          value={formData.customerName}
          onChange={handleChange}
        />

        <input
          type="email"
          name="customerEmail"
          placeholder="Customer Email"
          value={formData.customerEmail}
          onChange={handleChange}
        />

        <input
          type="text"
          name="customerPhone"
          placeholder="Customer Phone"
          value={formData.customerPhone}
          onChange={handleChange}
        />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {!editId && (
          <div className="sales-items-block">
            <h3>Order Items</h3>

            {formData.items.map((item, index) => {
              const selectedProduct = productMap.get(Number(item.productId));

              return (
                <div className="sales-item-row" key={index}>
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleItemChange(index, "productId", e.target.value)
                    }
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock:{" "}
                        {product.quantity}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="Quantity"
                  />

                  <div className="sales-item-info">
                    {selectedProduct ? (
                      <>
                        <span>${Number(selectedProduct.price).toFixed(2)}</span>
                        <span>
                          Subtotal: $
                          {(
                            Number(selectedProduct.price) *
                            Number(item.quantity || 0)
                          ).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span>Select a product</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => removeItemRow(index)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}

            <div className="sales-item-buttons">
              <button type="button" className="edit-btn" onClick={addItemRow}>
                Add Product Row
              </button>
            </div>

            <div className="sales-total-box">
              <strong>Total: ${computedTotal.toFixed(2)}</strong>
            </div>
          </div>
        )}

        {editId && (
          <div className="sales-edit-note">
            Products and quantities are read-only in edit mode for now. You can
            update customer info and status. To change items, delete and recreate
            the order.
          </div>
        )}

        <div className="sales-form-actions">
          <button type="submit">
            {editId ? "Update Order" : "Create Order"}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {viewOrder && (
        <div className="sales-order-details">
          <h3>Order Details #{viewOrder.id}</h3>
          <p>
            <strong>Customer:</strong> {viewOrder.customerName}
          </p>
          <p>
            <strong>Email:</strong> {viewOrder.customerEmail}
          </p>
          <p>
            <strong>Phone:</strong> {viewOrder.customerPhone}
          </p>
          <p>
            <strong>Status:</strong> {viewOrder.status}
          </p>
          <p>
            <strong>Total:</strong> ${Number(viewOrder.totalAmount).toFixed(2)}
          </p>

          <table className="sales-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {viewOrder.items?.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sales-table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
           
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                 
                  <td>{order.customerName}</td>
                  <td>{order.itemCount}</td>
                  <td>${Number(order.totalAmount).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleView(order.id)}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEdit(order)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="invoice-btn"
                        onClick={() => handleDownloadInvoice(order.id)}
                      >
                        Invoice
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => openDeleteModal(order)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete order #${
          selectedOrder?.id || ""
        }? Stock will be restored.`}
      />
    </div>
  );
}

export default SalesPage;