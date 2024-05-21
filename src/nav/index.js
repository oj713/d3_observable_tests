import {useLocation} from 'react-router-dom';
import './nav_sidebar.css';
const NavSidebar = () => {

    const {pathname} = useLocation();
    let active = pathname.split("/")[1];

    const tabs = [
        {name: "Notes", path: "/"},
        {name: "General", path: "general"},
        {name: "Networks w/ Obs", path: "networksobs"}
    ]

    return (
    <div className = "jasper col sidebar nopad">
        <ul className = "list-group list-group-flush">
            {tabs.map(tab => 
                <a href = {`${tab.path}`} key = {tab.path} 
                className = {`${active === tab.path ? "active" : ""} list-group-item`}> {tab.name} </a>)}
        </ul>
    </div>
    )
}

export default NavSidebar;