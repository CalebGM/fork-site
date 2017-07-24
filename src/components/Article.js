import React, { Component } from 'react';

class Article extends React.Component {
	constructor(props) {
		super(props);
		console.log(props);
		this.state = { key: props.match.params.article };
	}
	
	componentDidMount() {
		var currentPath = this.props.location.pathname;
		var parentPath = currentPath.substring(1, currentPath.lastIndexOf("/"));
		console.log(parentPath);
		fetch("http://localhost:3001/getArticle",
		{
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ category: parentPath, key: this.state.key })
		})
			.then((response) => response.json())
			.then((rs) => {
				//console.log(rs.body);
				//console.log(rs.Body.data.toString());
				this.setState({ article: rs.body });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	render() {
		//console.log(this.state.article);
		return (
		
			<div>
				{ this.state.article }
			</div>
		
		)
	}
}

export default Article;