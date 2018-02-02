import React from 'react';
import { Link } from 'react-router-dom';
import QuickArticleDisplay from './QuickArticleDisplay.js';
import CategoryStyles from '../Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];


class Author extends React.Component {
	constructor(props) {
		super(props);
		var page = Number(props.match.params.num);
		var nextPage = (page + 1).toString();
		
		this.state = { articles: null, author: props.match.params.author, page: page, nextPage: nextPage };
	}
	
	
	componentDidMount() {
		this.fetchAuthorArticles();
	}
	
	
	componentWillReceiveProps(nextProps) {
		if (this.props.match.params.author !== nextProps.match.params.author) {
			this.setState({ articles: null, author: nextProps.match.params.author, page: '1', nextPage: '2'}, 
				() => this.fetchAuthorArticles());
		} else if (this.state.page !== nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchAuthorArticles());
		}
	}
	
	
	fetchAuthorArticles() {
		fetch(config.url + "/getAuthorPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ author: this.state.author, page: this.state.page }),
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
			<div className={CategoryStyles.articleList}>
				{this.state.articles ? (
					this.state.articles.map(article => (
						<div key={article.Title}>
							<QuickArticleDisplay  article={article} />
						</div>
					))
				) : (
					<div></div>
				)}
			</div>
			<div>
				<Link className={CategoryStyles.link} to={`/realHome/auth/${this.state.author}/page=${this.state.nextPage}`}>
					Next Page
				</Link>
			</div>
		</div>
		);
	}


}

export default Author;