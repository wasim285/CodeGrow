import { useState, useEffect } from "react";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://127.0.0.1:8000/api/accounts/profile/", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to load profile data.");
                }

                const data = await response.json();
                setUserData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return <div className="profile-container">Loading...</div>;
    }

    if (error) {
        return <div className="profile-container error-message">{error}</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-box">
                <div className="profile-header">
                    <div className="profile-pic">{userData.username.charAt(0).toUpperCase()}</div>
                    <h2>Account Settings</h2>
                </div>

                <div className="profile-info">
                    <div className="profile-field">
                        <label>First Name:</label>
                        <input type="text" value={userData.first_name || ""} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Last Name:</label>
                        <input type="text" value={userData.last_name || ""} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Username:</label>
                        <input type="text" value={userData.username} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Email:</label>
                        <input type="text" value={userData.email} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Learning Goal:</label>
                        <input type="text" value={userData.learning_goal || "Not Set"} disabled />
                    </div>

                    <div className="profile-field">
                        <label>Difficulty Level:</label>
                        <input type="text" value={userData.difficulty_level || "Not Set"} disabled />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
