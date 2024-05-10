import {useLocation} from 'react-router-dom';
import './nav_sidebar.css';
const NavSidebar = () => {

    const {pathname} = useLocation();
    let active = pathname.split("/")[1];

    const tabs = [
        {name: "Notes", path: ""},
        {name: "Scatterplots", path: "scatterplots"}
    ]

    return (
    <div className = "jasper sidebar nopad">
        <ul className = "list-group list-group-flush">
            {tabs.map(tab => 
                <a href = {`/${tab.path}`} className = {`${active === tab.path ? "active" : ""} list-group-item`}> {tab.name} </a>)}
        </ul>
    </div>
    )
}

export default NavSidebar;