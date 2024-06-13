import {Link, useLocation} from 'react-router-dom';
import './nav_sidebar.css';
const NavSidebar = ({isCollapsed, toggleSidebar}) => {

    const {pathname} = useLocation();
    let active = pathname.split("/")[1];

    const tabs = [
        {name: "Notes", path: ""},
        {name: "General", path: "general"},
        {name: "Networks Gen", path: "networksgen"},
        {name: "Bayesian Nodes", path: "bayesian-nodes"},
        {name: "Bayesian Random", path: "bayesian-net"},
        {name: "Propagated BN", path: "propagated-net"},
    ]

    return (
    <div className = {`jasper col sidebar nopad ${isCollapsed ? "collapsed" : "normal"}`}>
        <div className = "d-flex justify-content-center">
            <button className = "toggle-button" onClick = {toggleSidebar}>
                {isCollapsed ? ">>" : "<<"}
            </button>
        </div>
        {!isCollapsed && 
        <ul className = "list-group list-group-flush">
            {tabs.map(tab => 
                <Link key = {tab.name} 
                className={`${active === tab.path ? "active" : ""} list-group-item`} 
                to={tab.path}>
                    {tab.name}
                </Link>
            )}
        </ul>
        }
    </div>
    )
}

export default NavSidebar;