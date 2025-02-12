import { useState, useEffect } from "react";
import { getProfile } from "../utils/api"; // ✅ Import API function
import "../styles/ProfilePage.css";

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("User not authenticated.");

                const response = await getProfile(token); // ✅ Use API call
                setUserData(response.data);
            } catch (err) {
                setError(err.message || "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="profile-container">Loading...</div>;
    if (error) return <div className="profile-container error-message">{error}</div>;

    return (
        <div className="profile-page">
            <div className="profile-box">
                <div className="profile-header">
                    <div className="profile-pic">{userData.username.charAt(0).toUpperCase()}</div>
                    <h2>Account Settings</h2>
                </div>

                <div className="profile-info">
                    {["first_name", "last_name", "username", "email", "learning_goal", "difficulty_level"].map((field) => (
                        <div className="profile-field" key={field}>
                            <label>{field.replace("_", " ")}:</label>
                            <input type="text" value={userData[field] || "Not Set"} disabled />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
