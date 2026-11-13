import {useEffect,useState} from 'react';
import {useAuth} from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Schedule from './pages/Schedule';
import History from './pages/History';
import Scanner from './pages/Scanner';
import Account from './pages/Account';
import {Menu,X,Bell} from 'lucide-react';
import api from './services/api';

function ReminderWatcher({user}) {
  const [permission,setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  useEffect(() => {
    if (!user || permission !== 'granted' || typeof Notification === 'undefined') return;
    let stopped = false;
    const check = async () => {
      try {
        const {data: medicines} = await api.get('/medicines');
        if (stopped) return;
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        for (const medicine of medicines) {
          if (!(medicine.schedule || []).includes(hhmm)) continue;
          const key = `pillsync-reminder:${now.toDateString()}:${hhmm}:${medicine._id}`;
          if (localStorage.getItem(key)) continue;
          new Notification(`PillSync dose reminder: ${medicine.name}`, {
            body: `Scheduled time ${hhmm}. Check your prescription and record the dose in PillSync.`,
            tag: key
          });
          localStorage.setItem(key, 'sent');
        }
      } catch {
        // A reminder check must not break the rest of the application.
      }
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [user, permission]);

  async function enable() {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (!user) return null;
  return (
    <button className="notification-btn" onClick={enable} title="Enable browser reminders">
      <Bell size={16}/>
      {permission === 'granted' ? 'Reminders enabled' : permission === 'unsupported' ? 'Notifications unavailable' : 'Enable reminders'}
    </button>
  );
}

export default function App(){
  const {user,loading,logout}=useAuth();
  const [page,setPage]=useState('dashboard');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [patients,setPatients]=useState([]);
  const [patientId,setPatientId]=useState('');
  useEffect(()=>{if(user?.role==='caregiver'){api.get('/caregivers/patients').then(r=>{setPatients(r.data||[]);setPatientId(cur=>cur||r.data?.[0]?.patient?._id||'')}).catch(()=>setPatients([]));}},[user]);
  if(loading)return <div className="loading-screen">Loading PillSync…</div>;
  if(!user)return <AuthPage/>;
  const titles={dashboard:'Overview',medicines:'My medicines',schedule:'Dose schedule',history:'Dose history',scanner:'Medicine scanner',account:'Profile & caregivers'};
  const patientContext={patientId:user.role==='caregiver'?patientId:'',readOnly:user.role==='caregiver'&&!!patientId};
  const content=page==='medicines'?<Medicines {...patientContext}/>:page==='schedule'?<Schedule {...patientContext}/>:page==='history'?<History {...patientContext}/>:page==='scanner'?<Scanner/>:page==='account'?<Account user={user}/>:<Dashboard setPage={setPage} {...patientContext}/>;
  return <div className="app-shell">
    <ReminderWatcher user={user}/>
    <div className={`mobile-overlay ${mobileOpen?'show':''}`} onClick={()=>setMobileOpen(false)}></div>
    <div className={`sidebar-wrap ${mobileOpen?'open':''}`}><Sidebar page={page} setPage={p=>{setPage(p);setMobileOpen(false)}} user={user} logout={logout}/></div>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button>
        <div className="breadcrumb">Workspace <span>/</span> <b>{titles[page]}</b></div>
        <div className="top-user">{user.role==='caregiver'&&<select className="patient-switcher" aria-label="Select patient" value={patientId} onChange={e=>setPatientId(e.target.value)}><option value="">Select patient</option>{patients.map(x=><option key={x.patient._id} value={x.patient._id}>{x.patient.name}</option>)}</select>}<ReminderWatcher user={user}/><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><b>{user.name}</b><small>{user.role}</small></div></div>
      </header>
      <div className="page-content">{content}<footer className="footer">PillSync · Medication organization made simpler <span>Educational project — not medical advice</span></footer></div>
    </main>
  </div>;
}
