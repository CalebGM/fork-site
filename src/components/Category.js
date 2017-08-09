import React, { Component } from 'react'
import {Route, Link} from 'react-router-dom';
import Article from './Article.js';

class Category extends React.Component {
	constructor(props) {
		super(props);
		console.log(this);
		var path = props.match.path;
		var cat = path.substring(1);
		this.state = { articles: null, cat: props.match.params.subCat };
	}
	
	componentDidMount() {
		this.fetchCategoryArticles();
	}
	
	componentWillReceiveProps(nextProps) {
		if (this.props.match.params.subCat != nextProps.match.params.subCat) {
			this.setState({ articles: null, cat: nextProps.match.params.subCat}, 
				() => this.fetchCategoryArticles());
		}
	}
	
	componentWillUnmount() {
		this.setState({});
	}
	
	
	
	fetchCategoryArticles() {
		fetch("http://localhost:3001/getCategoryPage",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ category: this.state.cat }),
		})
			.then((response) => response.json())
			.then((rs) => {
				console.log(rs);
				this.setState({ articles: rs });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	
	render() {
		return (
			<div>
				{this.state.articles ? (
					this.state.articles.map(article => (
						<div key={article.Key}>
							<Link to={`/${this.state.cat}/${article.Key}`}>
								{article.Key}
							</Link>
						</div>
					))
				) : (
					<div></div>
				)}
				
				<Route path={`/${this.state.cat}/:article`} component={Article} category={this.state.cat}/>
				<h1>Testing { this.state.cat } Page</h1>
			</div>
		);
	}
	
	
}

export default Category;