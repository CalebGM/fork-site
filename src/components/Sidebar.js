import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import SidebarStyles from '../Sidebar.css';


function Sidebar(props) {
	const { login } = props;
	
	return (
		<div className={SidebarStyles.Container}>
			<Link className={SidebarStyles.Links} to="/realHome/cat/art/page=1">Art</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/comics/page=1">Comics</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/fake_news/page=1">Fake News</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/life/page=1">Life</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/movies/page=1">Movies</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/music/page=1">Music</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/sports/page=1">Sports</Link> <br />
			<Link className={SidebarStyles.Links} to="/realHome/cat/video_games/page=1">Video Games</Link> <br />
			
			{login ? (
				<div>
					<Link className={SidebarStyles.Links} to="/realHome/admin/publish">Publish Article</Link> <br />
				</div>
			) : (
				<div></div>
			)}
			
		</div>
	);
}

const mapStateToProps = state => {
	return {
		login: state.login
	}
}

export default connect(mapStateToProps)(Sidebar)