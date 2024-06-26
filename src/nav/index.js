import {Link, useLocation} from 'react-router-dom';
import {useState} from 'react';
import './nav_sidebar.css';
const NavSidebar = () => {
    const {pathname} = useLocation();
    let active = pathname.split("/")[1];
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
    }

    const tabs = [
        {name: "Propagated BN", path: ""},
        {name: "General", path: "general"},
        {name: "Networks Gen", path: "networksgen"},
        {name: "Bayesian Nodes", path: "bayesian-nodes"},
        {name: "Bayesian Random", path: "bayesian-net"},
        {name: "Notes", path: "notes"},
    ]

    return (
    <div className = {`jasper col sidebar nopad ${isCollapsed ? "collapsed" : "normal"}`}>
        <div className = "d-flex justify-content-center">
            <button className = "toggle-button pt-2" onClick = {toggleSidebar}>
                {isCollapsed ? ">>" : "<<"}
            </button>
        </div>
        {!isCollapsed && 
        <ul className = "list-group list-group-flush">
            {tabs.map(tab => 
                <Link key = {tab.name} 
                className={`${active === tab.path ? "active" : ""} list-group-item`} 
                to={tab.path} onClick = {toggleSidebar}>
                    {tab.name}
                </Link>
            )}
        </ul>
        }
    </div>
    )
}

export default NavSidebar;