import {createContext,useContext,useEffect,useState} from 'react';import api from '../services/api';const C=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
useEffect(()=>{if(!localStorage.getItem('pillsync_token')){setLoading(false);return}api.get('/auth/me').then(x=>setUser(x.data.user)).catch(()=>localStorage.removeItem('pillsync_token')).finally(()=>setLoading(false))},[]);
async function login(email,password){const {data}=await api.post('/auth/login',{email,password});localStorage.setItem('pillsync_token',data.token);setUser(data.user)}
async function register(name,email,password,role='patient'){const {data}=await api.post('/auth/register',{name,email,password,role});localStorage.setItem('pillsync_token',data.token);setUser(data.user)}
function logout(){localStorage.removeItem('pillsync_token');setUser(null)}
return <C.Provider value={{user,loading,login,register,logout}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);