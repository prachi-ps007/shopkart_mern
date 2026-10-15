import {createContext, useContext, useEffect, useState} from "react";
import {axiosInstance} from "../axiosCalls/axios.js";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try{
                const userData = await axiosInstance.get("/customers/me");
                setUser(userData.data.authenticatedUser);
            }
            catch (err) {
                setUser(null); // not logged in yet — expected, not an error
            } 
        }
        fetchUser();
    },[])


    return (
        <AuthContext.Provider value={{user, setUser}}>
            {children}
        </AuthContext.Provider>
    )
}


export const useAuth = () => {
    return useContext(AuthContext);
}

