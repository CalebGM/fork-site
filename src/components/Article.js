import React, { Component } from 'react';
import Editor from 'draft-js-plugins-editor';
import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createResizeablePlugin from 'draft-js-resizeable-plugin';
import createAlignmentPlugin from 'draft-js-alignment-plugin';
import { EditorState, convertFromRaw } from 'draft-js';
import ModifiedVideoWrapper from './ModifiedVideoWrapper.js';


const imagePlugin = createImagePlugin();
const focusPlugin = createFocusPlugin();
const resizeablePlugin = createResizeablePlugin();
const alignmentPlugin = createAlignmentPlugin();
const videoPlugin = createVideoPlugin({ 
	autoHandlePastedText: true, 
	videoComponent: (props) => {
		return (
			<ModifiedVideoWrapper props={props} />
		);
	},
});

const plugins = [imagePlugin, focusPlugin, resizeablePlugin, alignmentPlugin, videoPlugin];

class Article extends React.Component {
	constructor(props) {
		super(props);
		console.log(props);
		this.state = { article: EditorState.createEmpty(), 
						key: props.match.params.article };
	}
	
	componentDidMount() {
		console.log('hello');
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
				console.log(rs.body);
				var cookedContent = convertFromRaw(rs.body);
				var selArticle = EditorState.createWithContent(cookedContent);
				this.setState({ article: selArticle });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	render() {
		console.log(this.state.article);
		return (
		
			<div>
				<Editor editorState={this.state.article} plugins={plugins} readOnly />
				
			</div>
		
		)
	}
}

export default Article;