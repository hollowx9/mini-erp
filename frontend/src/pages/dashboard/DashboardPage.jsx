import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import StatCard from "../../components/common/StatCard";

import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

import {
  getDashboardStats,
  getAnalytics,
  getRecentOrders,
} from "../../services/dashboardService";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    lowStock: 0,
  });

  const [analytics, setAnalytics] = useState({
    revenue: [],
    orders: [],
  });

  const [recentOrders, setRecentOrders] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const statsData = await getDashboardStats();
      const analyticsData = await getAnalytics();
      const recentOrdersData = await getRecentOrders();

      setStats(statsData);
      setAnalytics(analyticsData);
      setRecentOrders(recentOrdersData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const revenueChart = {
    labels: analytics.revenue.map((item) => item.date),
    datasets: [
      {
        label: "Revenue",
        data: analytics.revenue.map((item) => item.total),
        borderWidth: 2,
      },
    ],
  };

  const ordersChart = {
    labels: analytics.orders.map((item) => item.date),
    datasets: [
      {
        label: "Orders",
        data: analytics.orders.map((item) => item.total),
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <StatCard
          title="Employees"
          value={stats.employees}
          icon={<Users size={24} />}
          variant="blue"
        />

        <StatCard
          title="Products"
          value={stats.products}
          icon={<Package size={24} />}
          variant="purple"
        />

        <StatCard
          title="Orders"
          value={stats.orders}
          icon={<ShoppingCart size={24} />}
          variant="orange"
        />

        <StatCard
          title="Revenue"
          value={`$${Number(stats.revenue).toFixed(2)}`}
          icon={<DollarSign size={24} />}
          variant="green"
        />

        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={<AlertTriangle size={24} />}
          variant="red"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h3>Revenue Trends</h3>
          <Line data={revenueChart} />
        </div>

        <div className="chart-box">
          <h3>Sales Trends</h3>
          <Bar data={ordersChart} />
        </div>
      </div>

      <div className="recent-orders-card">
        <div className="recent-orders-header">
          <h3>Most Recent Orders</h3>
          <span>{recentOrders.length} latest</span>
        </div>

        <div className="recent-orders-list">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div className="recent-order-item" key={order.id}>
                <div>
                  <h4>Order #{order.id}</h4>
                  <p>{order.customerName}</p>
                </div>

                <div>
                  <strong>${Number(order.totalAmount).toFixed(2)}</strong>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-text">No recent orders found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;