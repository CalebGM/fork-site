import React from 'react';
import { Link } from 'react-router-dom';
import QuickArticleDisplay from './QuickArticleDisplay.js';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];




class Home extends React.Component {
	constructor(props) {
		super(props);
		var page;
		if (props.match.params.num) {
			page = Number(props.match.params.num);
		} else {
			page = 1;
		}
		var nextPage = (page + 1).toString();
		
		this.state = { articles: null, page: page, nextPage: nextPage };
	}
	
	
	componentDidMount() {
		this.fetchHomeArticles();
	}
	
	
	
	componentWillReceiveProps(nextProps) {
		if ((this.state.page !== nextProps.match.params.num) && nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchHomeArticles());
		} else if (nextProps !== this.props) {
			//this.setState({ articles: null, page: 1, nextPage: 2 },
				//() => this.fetchHomeArticles());
		}
	}
	
	
	fetchHomeArticles() {
		fetch(config.url + "/getHomePage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ page: this.state.page }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				this.setState({ articles: rs });
			})
			.catch((error) => {
				console.log(error);
			})
	}
	
	
	render() {
		return (
		<div>
			<div>
				{this.state.articles ? (
					this.state.articles.map(article => (
						<div key={article.Title}>
							<QuickArticleDisplay  article={article} />
						</div>
					))
				) : (
					<div></div>
				)}
				
				<h1>Testing Home Page</h1>
			</div>
			<div>
				<Link to={`/page=${this.state.nextPage}`}>
					Next Page
				</Link>
			</div>
		</div>
		);
	}

}


export default Home;