import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <h3>ERP Management System</h3>

      <div className="nav-right">
      
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Navbar;