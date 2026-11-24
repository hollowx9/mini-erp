import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import ConfirmModal from "../../components/common/ConfirmModal";

import StatCard from "../../components/common/StatCard";

import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";

import { getOrders } from "../../services/orderService";

import {
  getPayments,
  getFinanceSummary,
  createPayment,
  updatePayment,
  deletePayment,
} from "../../services/paymentService";

function FinancePage() {
  const [payments, setPayments] = useState([]);

  const [orders, setOrders] = useState([]);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    todayRevenue: 0,
    pendingOrders: 0,
  });

  const [editId, setEditId] = useState(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    paymentMethod: "cash",
    paymentDate: "",
    note: "",
  });

  const fetchPayments = async () => {
    try {
      const data = await getPayments();

      setPayments(data);
    } catch (err) {
      console.error(err);

      toast.error("Failed to load payments");
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getOrders();

      setOrders(data);
    } catch (err) {
      console.error(err);

      toast.error("Failed to load orders");
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getFinanceSummary();

      setSummary(data);
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to load finance summary"
      );
    }
  };

  useEffect(() => {
    fetchPayments();

    fetchOrders();

    fetchSummary();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.orderId ||
      !formData.amount ||
      !formData.paymentMethod ||
      !formData.paymentDate
    ) {
      toast.warning(
        "Please fill in all required fields"
      );

      return false;
    }

    if (Number(formData.amount) <= 0) {
      toast.warning(
        "Amount must be greater than 0"
      );

      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      orderId: "",
      amount: "",
      paymentMethod: "cash",
      paymentDate: "",
      note: "",
    });

    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editId) {
        await updatePayment(editId, {
          amount: formData.amount,
          paymentMethod:
            formData.paymentMethod,
          paymentDate: formData.paymentDate,
          note: formData.note,
        });

        toast.success(
          "Payment updated successfully"
        );
      } else {
        await createPayment(formData);

        toast.success(
          "Payment created successfully"
        );
      }

      resetForm();

      fetchPayments();

      fetchOrders();

      fetchSummary();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          "Operation failed"
      );
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      orderId: String(payment.orderId),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      note: payment.note || "",
    });

    setEditId(payment.id);
  };

  const openDeleteModal = (payment) => {
    setSelectedPayment(payment);

    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPayment) return;

    try {
      await deletePayment(selectedPayment.id);

      toast.success(
        "Payment deleted successfully"
      );

      if (editId === selectedPayment.id) {
        resetForm();
      }

      fetchPayments();

      fetchOrders();

      fetchSummary();
    } catch (err) {
      console.error(err);

      toast.error("Failed to delete payment");
    } finally {
      setIsModalOpen(false);

      setSelectedPayment(null);
    }
  };

  return (
    <div className="finance-page">
      <h2>Finance</h2>

      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={`$${Number(
            summary.totalRevenue
          ).toFixed(2)}`}
          icon={<DollarSign size={24} />}
          variant="green"
        />

        <StatCard
          title="Total Payments"
          value={summary.totalPayments}
          icon={<ShoppingCart size={24} />}
          variant="blue"
        />

        <StatCard
          title="Today's Revenue"
          value={`$${Number(
            summary.todayRevenue
          ).toFixed(2)}`}
          icon={<DollarSign size={24} />}
          variant="purple"
        />

        <StatCard
          title="Pending Orders"
          value={summary.pendingOrders}
          icon={
            <AlertTriangle size={24} />
          }
          variant="red"
        />
      </div>

      <form
        className="finance-form"
        onSubmit={handleSubmit}
      >
        <select
          name="orderId"
          value={formData.orderId}
          onChange={handleChange}
          disabled={!!editId}
        >
          <option value="">
            Select Order
          </option>

          {orders.map((order) => (
            <option
              key={order.id}
              value={order.id}
            >
              Order #{order.id} -{" "}
              {order.customerName} - $
              {Number(
                order.totalAmount
              ).toFixed(2)}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
        />

        <select
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
        >
          <option value="cash">Cash</option>

          <option value="card">
            Card
          </option>

          <option value="bank_transfer">
            Bank Transfer
          </option>
        </select>

        <input
          type="date"
          name="paymentDate"
          value={formData.paymentDate}
          onChange={handleChange}
        />

        <input
          type="text"
          name="note"
          placeholder="Note"
          value={formData.note}
          onChange={handleChange}
        />

        <div className="finance-form-actions">
          <button type="submit">
            {editId
              ? "Update Payment"
              : "Add Payment"}
          </button>

          {editId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Order</th>

              <th>Customer</th>

              <th>Amount</th>

              <th>Method</th>

              <th>Date</th>

              <th>Note</th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    #{payment.orderId}
                  </td>

                  <td>
                    {payment.customerName}
                  </td>

                  <td>
                    $
                    {Number(
                      payment.amount
                    ).toFixed(2)}
                  </td>

                  <td>
                    {payment.paymentMethod}
                  </td>

                  <td>
                    {payment.paymentDate}
                  </td>

                  <td>
                    {payment.note || "-"}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(payment)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() =>
                        openDeleteModal(payment)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);

          setSelectedPayment(null);
        }}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete payment #${
          selectedPayment?.id || ""
        }?`}
      />
    </div>
  );
}

export default FinancePage;