import React from 'react';
import {Route, Link} from 'react-router-dom';


function Sidebar(props) {
	return (
	<div className="Tabs">
		<Link to="/comics">Comics</Link> <br />
		<Link to="/movies">Movies</Link> <br />
		<Link to="/music">Music</Link> <br />
		<Link to="/videogames">Video Games</Link> <br />
		<Link to="/admin/publish">Publish Article</Link> <br />
	</div>
	);
}

export default Sidebar;