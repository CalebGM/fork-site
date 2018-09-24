/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';

import Editor from 'draft-js-plugins-editor';
import {DefaultDraftBlockRenderMap, EditorState, ContentState, RichUtils, Modifier, convertToRaw} from 'draft-js';
import Immutable from 'immutable';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createToolbarPlugin from 'last-draft-js-toolbar-plugin';
//import '!style-loader!css-loader!../styles/draftToolbarStyles.css';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import '!style-loader!css-loader!draft-js-linkify-plugin/lib/plugin.css';
import createLinkPlugin from 'draft-js-link-plugin';
import '!style-loader!css-loader!draft-js-link-plugin/lib/plugin.css';

import editorStyles from '../styles/Editor.css';
import videoStyles from '../styles/Video.css';
import imageStyles from '../styles/Image.css';
import aboutStyles from '../styles/AboutUs.css';
import '!style-loader!css-loader!draft-js-inline-toolbar-plugin/lib/plugin.css';
import 'draft-js-image-plugin/lib/plugin.css';

import MediaAdd from './MediaAdd.js';


var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

const linkPlugin = createLinkPlugin({
	component: (props) => {
        const { contentState, ...rest } = props;
        console.log(props);
		// jsx-a11y/anchor-has-content
		return (<a {...rest} target="_blank"/>);
	}
});
const linkifyPlugin = createLinkifyPlugin({
	component: (props) => {
		const { contentState, ...rest} = props;
        console.log(props);
		// jsx-a11y/anchor-has-content
		return (<a {...rest} target="_blank"/>);
	}
});
const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const focusPlugin = createFocusPlugin();
const imagePlugin = createImagePlugin({ theme: imageStyles });
const videoPlugin = createVideoPlugin({theme: videoStyles})

const DraftImgContainer = (props) => {
	return (
		<figure className={editorStyles.videoAndImagesContainer}>
			<div className={editorStyles.videoAndImages}>{props.children}</div>
		</figure>
	)
}

const blockRenderMap = Immutable.Map({
	'atomic': {
		element: DraftImgContainer
	}
});

const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);


const plugins2 = [focusPlugin, videoPlugin, toolbarPlugin, linkifyPlugin, imagePlugin, linkPlugin];
const tabCharacter = "	";

class EditAbout extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			body: props.body,
			fetches: {},
			finishPublish: false
		}
		this.onChangeBody = (body) => this.setState({body});
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);
		this.handlePastedText = this.handlePastedText.bind(this);
		this.onTab = this.onTab.bind(this);		
	}
	
	
	handleKeyCommand(command) {
		const newState = RichUtils.handleKeyCommand(this.state.body, command);
		if (newState) {
			this.onChangeBody(newState);
			return 'handled';
		}
		return 'not-handled';
	}
	
	onTab(e) {
		e.preventDefault();

		let currentState = this.state.body;
		let newContentState = Modifier.replaceText(
		  currentState.getCurrentContent(),
		  currentState.getSelection(),
		  tabCharacter
		);

		this.setState({body: EditorState.push(currentState, newContentState, 'insert-characters')});
	}
	
	
	handlePastedText(text) {
		const { body } = this.state;
		const pastedBlocks = ContentState.createFromText(text).blockMap;
		const newState = Modifier.replaceWithFragment(
			body.getCurrentContent(),
			body.getSelection(),
			pastedBlocks
		);
		this.onChangeBody(EditorState.push(body, newState, 'insert-fragment'));
		return 'handled';
	}
	
	handleSubmit(event) {
		event.preventDefault();
		console.log('hello');
		var articleContent = this.state.body.getCurrentContent();
		
		var firstBlock = articleContent.getFirstBlock();
		var nextBlock = articleContent.getBlockAfter(firstBlock.key);
		
		while (nextBlock) {
			let key = nextBlock.getEntityAt(0);
			if (key) {
				let entity = articleContent.getEntity(key);
				if (entity.type === "image") {
					let uploadUrl = "https://s3-us-west-2.amazonaws.com/cthouse-media/media";
					let imageUrl = entity.data.src;
					let imageBaseUrl = imageUrl.substring(0, imageUrl.lastIndexOf('/'));
					
					if (uploadUrl !== imageBaseUrl) {
						let fetches = this.state.fetches;
						fetches[key] = entity;
						this.setState({ fetches: fetches });
					}
				}
			}
			nextBlock = articleContent.getBlockAfter(nextBlock.key);
		}
		
		
		var fetches = this.state.fetches;
		var promises = [];
		for (var key in fetches) {
			let request = this.uploadDraftImage(key, fetches, articleContent);
			promises.push(request);
		}
	
		Promise.all(promises).then(() => {
			var articleContentImg = this.state.body.getCurrentContent();
			var articleRaw = convertToRaw(articleContentImg);
			
			fetch(config.url + "/admin/publish/updateAbout",
			{
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ article: articleRaw }),
				credentials: 'include'
			})
				.then((response) => {
					this.setState({ finishPublish: true });
				})
				.catch((error) => {
					console.log(error);
				});
		});
	}
	
	
	uploadDraftImage(key, entityObject, articleContent) {
		let entity = entityObject[key];
		let oldUrl = entity.data.src;
		var junkBlob = new Blob(['sup'], {type: 'text/plain'});
		if (entity.data.file) {
			let localFile = new FormData();
            localFile.append('file', entity.data.file.image);
            localFile.append('fileName', junkBlob, entity.data.file.name);
			localFile.append('title', junkBlob, 'About');
			localFile.append('draft', junkBlob);
			
				
			return fetch(config.url + "/admin/publish/uploadLocalImage",
			{
				method: 'post',
				body: localFile,
				credentials: 'include'
			})
				.then((response) => response.json())
				.then((rs) => {
					articleContent = articleContent.replaceEntityData(key, { src: rs.url, file: null });
					let newArticle = EditorState.createWithContent(articleContent);
		
					this.setState({ body: newArticle });
				})
				.catch((error) => {
					console.log(error);
				});
		} else {
			return fetch(config.url + "/admin/publish/uploadImage",
			{
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: oldUrl, title: 'About', draft: true }),
				credentials: 'include'
			})
				.then((response) => response.json())
				.then((rs) => {
					articleContent = articleContent.replaceEntityData(key, { src: rs.url, file: null });
					let newArticle = EditorState.createWithContent(articleContent);
		
					this.setState({ body: newArticle });
				})
				.catch((error) => {
					console.log(error);
				});
		}
	}
	
	
	
	
	
	
	_onBoldClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.body, 'BOLD'));
	}
	
	_onItalicizeClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.body, 'ITALIC'));
	}
	

	render() {
		const { onCancel, onPublish } = this.props;
		const { finishPublish, body } = this.state;
		
		if (finishPublish) {
			console.log('hello');
			onPublish();
		}
		
		return (
			<div className={editorStyles.publishBody}>
				<div className={aboutStyles.Title}>About Us</div>
			
				<div>
					<button className={editorStyles.button} onClick={this._onBoldClick.bind(this)}>Bold</button>
					<button className={editorStyles.button} onClick={this._onItalicizeClick.bind(this)}>Italic</button>
					<MediaAdd
						editorState={this.state.body}
						onChange={this.onChangeBody}
						modifier={imagePlugin.addImage}
						type="image"
					/>
					<MediaAdd
						editorState={this.state.body}
						onChange={this.onChangeBody}
						modifier={videoPlugin.addVideo}
						type="video"
					/>
				</div>
				
				<div className={editorStyles.editor} >
					<Editor 
						editorState={body} 
						handleKeyCommand={this.handleKeyCommand}
						handlePastedText={this.handlePastedText}
						onTab={this.onTab}
						blockRenderMap={extendedBlockRenderMap}
						onChange={this.onChangeBody} 
						plugins={plugins2}
						textAlign='left'
						//ref={(element) => { this.editor = element; }}
					/>
					<Toolbar />
				</div>
				
				<div>
					<div style={{display: 'inline-block', float: 'left'}}>
						<button onClick={() => onCancel()}>Cancel Edits</button>
					</div>
					<div style={{display: 'inline-block', float: 'right'}}>
						<button onClick={this.handleSubmit}>Publish Changes</button>
					</div>
				</div>
			</div>
		)
		
	}
	
}


export default EditAbout