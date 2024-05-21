import {Link, useLocation} from 'react-router-dom';
import './nav_sidebar.css';
const NavSidebar = () => {

    const {pathname} = useLocation();
    let active = pathname.split("/")[1];

    const tabs = [
        {name: "Notes", path: ""},
        {name: "General", path: "general"},
        {name: "Networks Gen", path: "networksgen"},
        {name: "Bayesian Nets", path: "bayesian-nets"}
    ]

    return (
    <div className = "jasper col sidebar nopad">
        <ul className = "list-group list-group-flush">
            {tabs.map(tab => 
                <Link key = {tab.name} 
                className={`${active === tab.path ? "active" : ""} list-group-item`} 
                to={tab.path}>
                    {tab.name}
                </Link>
            )}
        </ul>
    </div>
    )
}

export default NavSidebar;