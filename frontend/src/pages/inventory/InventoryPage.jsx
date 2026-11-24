import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
    lowStockThreshold: "",
  });

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
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search);

      const isLowStock =
        Number(product.quantity) <= Number(product.lowStockThreshold);

      const matchesStockFilter =
        stockFilter === "all" ||
        (stockFilter === "low" && isLowStock) ||
        (stockFilter === "ok" && !isLowStock);

      return matchesSearch && matchesStockFilter;
    });
  }, [products, searchTerm, stockFilter]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const reset = () => {
    setForm({
      name: "",
      sku: "",
      price: "",
      quantity: "",
      lowStockThreshold: "",
    });
    setEditId(null);
  };

  const validateForm = () => {
    if (!form.name || !form.sku || !form.price) {
      toast.warning("Name, SKU and price are required");
      return false;
    }

    if (Number(form.price) <= 0) {
      toast.warning("Price must be greater than 0");
      return false;
    }

    if (form.quantity && Number(form.quantity) < 0) {
      toast.warning("Quantity cannot be negative");
      return false;
    }

    if (form.lowStockThreshold && Number(form.lowStockThreshold) < 0) {
      toast.warning("Low stock threshold cannot be negative");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editId) {
        await updateProduct(editId, form);
        toast.success("Product updated successfully");
      } else {
        await createProduct(form);
        toast.success("Product created successfully");
      }

      reset();
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
    });

    setEditId(product.id);
  };

  const openDelete = (product) => {
    setSelected(product);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;

    try {
      await deleteProduct(selected.id);
      toast.success("Product deleted successfully");

      if (editId === selected.id) {
        reset();
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setModalOpen(false);
      setSelected(null);
    }
  };

  return (
    <div className="employees-page">
      <h2>Inventory</h2>

      <form className="employee-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
        />

        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <input
          name="lowStockThreshold"
          type="number"
          placeholder="Low Stock"
          value={form.lowStockThreshold}
          onChange={handleChange}
        />

        <div className="employee-form-actions">
          <button type="submit">
            {editId ? "Update Product" : "Add Product"}
          </button>

          {editId && (
            <button type="button" className="cancel-btn" onClick={reset}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="table-toolbar">
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">All products</option>
          <option value="low">Low stock only</option>
          <option value="ok">Stock OK only</option>
        </select>
      </div>

      <div className="employee-table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const isLowStock =
                  Number(product.quantity) <= Number(product.lowStockThreshold);

                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>{product.quantity}</td>
                    <td>
                      {isLowStock ? (
                        <span className="status-badge status-cancelled">
                          Low
                        </span>
                      ) : (
                        <span className="status-badge status-paid">OK</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => openDelete(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onConfirm={confirmDelete}
        message={`Delete ${selected?.name || "this product"}?`}
      />
    </div>
  );
}

export default InventoryPage;