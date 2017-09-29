import React from 'react'
import { Link } from 'react-router-dom';
import QuickArticleDisplay from './QuickArticleDisplay.js';
import CategoryStyles from '../Category.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

class Category extends React.Component {
	constructor(props) {
		super(props);
		var page = Number(props.match.params.num);
		var nextPage = (page + 1).toString();
		this.state = { articles: null, cat: props.match.params.subCat, page: page, nextPage: nextPage };
	}
	
	componentDidMount() {
		this.fetchCategoryArticles();
	}
	
	componentWillReceiveProps(nextProps) {
		if (this.props.match.params.subCat !== nextProps.match.params.subCat) {
			this.setState({ articles: null, cat: nextProps.match.params.subCat, page: '1', nextPage: '2'}, 
				() => this.fetchCategoryArticles());
		} else if (this.state.page !== nextProps.match.params.num) {
			var page = Number(nextProps.match.params.num);
			var nextPage = (page + 1).toString();
			this.setState({ articles: null, page: nextProps.match.params.num, nextPage: nextPage },
				() => this.fetchCategoryArticles());
		}
	}
	
	componentWillUnmount() {
		this.setState({});
	}
	
	
	
	fetchCategoryArticles() {		
		fetch(config.url + "/getCategoryPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ category: this.state.cat, page: this.state.page }),
			credentials: 'include'
		})
			.then((response) => response.json())
			.then((rs) => {
				this.setState({ articles: rs });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	render() {
		return (
		<div className={CategoryStyles.main}>
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
				
				<h1>Testing { this.state.cat } Page</h1>
			</div>
			<div className={CategoryStyles.link}>
				<Link to={`/cat/${this.state.cat}/page=${this.state.nextPage}`}>
					Next Page
				</Link>
			</div>
		</div>
		);
	}
	
	
}

export default Category;