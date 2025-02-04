import React, { useState } from "react";
import { runCode } from "../utils/api";

const API_BASE_URL = "http://127.0.0.1:8000/api/accounts/";

const runCode = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}run-code/`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            throw new Error("Failed to execute code.");
        }

        const data = await response.json();
        return data.output;
    } catch (error) {
        console.error("Error running code:", error);
        return "Error executing code.";
    }
};
