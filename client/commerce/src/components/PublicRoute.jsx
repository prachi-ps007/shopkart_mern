import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function PublicRoute({ children }){
    const {user} = useAuth()

    if(user){
        return <Navigate to="/home"/>
    }

    return children
}

export default PublicRoute