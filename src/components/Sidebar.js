import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';


function Sidebar(props) {
	const { login } = props;
	
	return (
		<div className="Tabs">
			<Link to="/cat/art/page=1">Art</Link> <br />
			<Link to="/cat/comics/page=1">Comics</Link> <br />
			<Link to="/cat/fake_news/page=1">Fake News</Link> <br />
			<Link to="/cat/life/page=1">Life</Link> <br />
			<Link to="/cat/movies/page=1">Movies</Link> <br />
			<Link to="/cat/music/page=1">Music</Link> <br />
			<Link to="/cat/sports/page=1">Sports</Link> <br />
			<Link to="/cat/video_games/page=1">Video Games</Link> <br />
			
			{login ? (
				<div>
					<Link to="/admin/publish">Publish Article</Link> <br />
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