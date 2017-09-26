/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import { Redirect } from 'react-router';

import Editor from 'draft-js-plugins-editor';
import {EditorState, RichUtils, convertToRaw} from 'draft-js';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin';

import editorStyles from '../Editor.css';
import videoStyles from '../Video.css';
import imageStyles from '../Image.css';
import '!style-loader!css-loader!draft-js-inline-toolbar-plugin/lib/plugin.css';
import 'draft-js-image-plugin/lib/plugin.css';

import MediaAdd from './MediaAdd.js';
import Preview from './Preview.js';


var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];



const toolbarPlugin = createInlineToolbarPlugin();
const focusPlugin = createFocusPlugin();
const imagePlugin = createImagePlugin({ theme: imageStyles });
const videoPlugin = createVideoPlugin({theme: videoStyles})
const { InlineToolbar } = toolbarPlugin;

function mediaBlockStyleFn(contentBlock) {
	const type = contentBlock.getType();
	if (type === 'atomic') {
		return editorStyles.videoAndImages;
	}
}


const plugins = [focusPlugin, videoPlugin, toolbarPlugin, imagePlugin];

const categories = ['Art', 'Comics', 'Fake_News', 'Life', 'Movies', 'Music', 'Sports', 'Video_Games'];


class EditArticle extends React.Component {
	constructor(props) {
		super(props);
		var categories = new Set(props.categories);
		
		this.state = {editorStateBody: props.article,
						ogTitle: props.title,
						title: props.title,
						author: props.author,
						category: categories,
						preview: false,
						finishPublish: false,
						deleteRedirect: false,
						fetches: {}
					};
						
		this.onChangeBody = (editorStateBody) => this.setState({editorStateBody});
		this.createCheckbox = this.createCheckbox.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleAuthorChange = this.handleAuthorChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);
	}
	
	
	handleKeyCommand(command) {
		const newState = RichUtils.handleKeyCommand(this.state.editorStateBody, command);
		if (newState) {
			this.onChangeBody(newState);
			return 'handled';
		}
		return 'not-handled';
	}
	
	handleChange(event) {
		var newCat = this.state.category;
		if(newCat.has(event.target.value)) {
			newCat.delete(event.target.value);
			this.setState({category: newCat});
		} else {
			newCat.add(event.target.value);
			this.setState({category: newCat});
		}
	}
	
	handleTitleChange(event) {
		this.setState({title: event.target.value});
	}
	
	handleAuthorChange(event) {
		this.setState({author: event.target.value});
	}
	
	handleSubmit(event) {
		event.preventDefault();
		var checkboxes = document.querySelectorAll('input[type="checkbox"]');
		var checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
		if (!checkedOne) {
			alert('Please check at least one category');
		} else {
			var myForm = document.getElementById('publish');
			var formData = new FormData(myForm);
			var articleContent = this.state.editorStateBody.getCurrentContent();
			
			var ogTitle = this.state.ogTitle;
			var cats = formData.getAll('cat');
			var title = formData.get('title');
			var author = formData.get('author');
			var firstBlock = articleContent.getFirstBlock();
			var nextBlock = articleContent.getBlockAfter(firstBlock.key);
			
			while (nextBlock) {
				let key = nextBlock.getEntityAt(0);
				if (key) {
					let entity = articleContent.getEntity(key);
					if (entity.type === "image") {
						let uploadUrl = "https://s3-us-west-2.amazonaws.com/ata-media/media";
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
				let request = this.uploadImage(key, fetches, articleContent);
				promises.push(request);
			}
			
			Promise.all(promises).then(() => {
				var articleContentImg = this.state.editorStateBody.getCurrentContent();
				var articleRaw = convertToRaw(articleContentImg);
				fetch(config.url + "/admin/publish/updateArticle",
				{
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ categories: cats, title: title, ogTitle: ogTitle, author: author, article: articleRaw })
				})
					.then((response) => {
						this.setState({ finishPublish: true });
					})
					.catch((error) => {
						console.log(error);
					});
			});
		}
	}
	
	
	uploadImage(key, entityObject, articleContent) {
		let entity = entityObject[key];
		let oldUrl = entity.data.src;
		if (entity.data.file) {
			let localFile = new FormData();
			localFile.append('file', entity.data.file);
				
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
		
					this.setState({ editorStateBody: newArticle });
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
				body: JSON.stringify({ url: oldUrl }),
				credentials: 'include'
			})
				.then((response) => response.json())
				.then((rs) => {
					articleContent = articleContent.replaceEntityData(key, { src: rs.url, file: null });
					let newArticle = EditorState.createWithContent(articleContent);
		
					this.setState({ editorStateBody: newArticle });
				})
				.catch((error) => {
					console.log(error);
				});
		}
	}
	
	
	createCheckbox(label) {
		return (
			<div className={editorStyles.checkboxes} key={categories.indexOf(label)}>
				<label>	
					<input type="checkbox" name="cat" value={label} checked={this.state.category.has(label)} onChange={this.handleChange} />
						{label}
				</label>
			</div>
		);
		
	}
	
	createCheckboxes() {
		return categories.map(this.createCheckbox);
	}
	
	
	_onBoldClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.editorStateBody, 'BOLD'));
	}
	
	_onItalicizeClick() {
		this.onChangeBody(RichUtils.toggleInlineStyle(this.state.editorStateBody, 'ITALIC'));
	}
	
	_onVidClick() {
		this.onChangeBody(videoPlugin.addVideo(this.state.editorStateBody, {src: 'https://www.youtube.com/watch?v=Ba1BWuiOVEs'}));
	}
	
	_onImgClick() {
		this.onChangeBody(imagePlugin.addImage(this.state.editorStateBody, 'http://static.lakana.com/media.fox5ny.com/photo/2017/05/11/redfoxfamily%20_OP_3_CP__1494549624513_3298485_ver1.0_640_360.jpg'));
	}
	
	_onPreviewClick() {
		this.setState({ preview: true });
	}
	
	_onEditClick() {
		this.setState({ preview: false });
	}
	
	_onDeleteClick() {
		var result = window.confirm("Are you sure you want to delete this article?");
		if (result) {
			fetch(config.url + "/admin/publish/deleteArticle",
			{
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ key: this.state.ogTitle }),
				credentials: 'include'
			})
				.then((response) => {
					if(response.status === 200) {
						this.setState({ deleteRedirect: true });
						alert("Article Successfully Deleted");
					}
				})
				.catch((error) => {
					console.log(error);
				})
					
		}
	}
	
	_focus = () => {
		this.editor.focus();
	}
	
	render() {
		const { onCancel, onPublish } = this.props;
		const { finishPublish, title, ogTitle, deleteRedirect } = this.state;
		
		if (finishPublish && (title !== ogTitle)) {
			return <Redirect to={`/story/${title}`} />;
		} else if (finishPublish) {
			onPublish();
		} else if (deleteRedirect) {
			return <Redirect to={`/`} />
		}
			
			
		
	
		return (
			<div className={editorStyles.publishBody} >
				{this.state.preview ? (
					<div>
						<Preview 
							article={this.state.editorStateBody}
							title={this.state.title}
							categories={this.state.category}
							author={this.state.author}
						/>
						<div>
							<button onClick={this._onEditClick.bind(this)}>Edit Article</button>
						</div>
					</div>
				) : (
					<div>
						<div style={{display: 'flex', justifyContent: 'space-between'}}>
							<div>
								<h1>Edit Your Article</h1>
							</div>
							<div style={{paddingTop: '24px'}}>
								<button style={{fontSize: '18px'}} onClick={this._onDeleteClick.bind(this)}>Delete Article</button>
							</div>
							
						</div>
						
						<div className={editorStyles.form} >
							<form name="publish" id="publish" onSubmit={this.handleSubmit} >
								<div >
									<fieldset className={editorStyles.checkField} >
										{this.createCheckboxes()}	
									</fieldset>
								</div>
								
								<div>
									<input type="text" name="title" value={this.state.title} placeholder="Give your article a unique title..." onChange={this.handleTitleChange} required />
								</div>
								
								<br /> 
								<br />
								
								<div>
									<input type="text" name="author" value={this.state.author} placeholder="Write the author's name..." onChange={this.handleAuthorChange} required />
								</div>
							</form>
						</div>
						
						<br />
						<br />
						
						<div className={editorStyles.buttons}>
							<button className={editorStyles.button} onClick={this._onBoldClick.bind(this)}>Bold</button>
							<button className={editorStyles.button} onClick={this._onItalicizeClick.bind(this)}>Italic</button>
							<button className={editorStyles.button} onClick={this._onVidClick.bind(this)}>Add Test Video</button>
							<button className={editorStyles.button} onClick={this._onImgClick.bind(this)}>Add Test Image</button>
							<MediaAdd
								editorState={this.state.editorStateBody}
								onChange={this.onChangeBody}
								modifier={imagePlugin.addImage}
								type="image"
							/>
							<MediaAdd
								editorState={this.state.editorStateBody}
								onChange={this.onChangeBody}
								modifier={videoPlugin.addVideo}
								type="video"
							/>
						</div>

						<div className={editorStyles.editor} onClick={this._focus}>
							<Editor 
								editorState = {this.state.editorStateBody} 
								handleKeyCommand={this.handleKeyCommand}
								textAlignment='right'
								blockStyleFn={mediaBlockStyleFn}
								onChange={this.onChangeBody} 
								plugins={plugins}
								ref={(element) => { this.editor = element; }}
								placeholder='Write the rest of your article.....'
							/>
							<InlineToolbar />
						</div>
						
						<div>
							<div style={{display: 'inline-block', float: 'left'}}>
								<button onClick={() => onCancel()}>Cancel Edits</button>
							</div>
						
							<div style={{display: 'inline-block', float: 'right'}}>
								<div style={{display: 'inline-block', paddingRight: '10px'}}>
									<button onClick={this._onPreviewClick.bind(this)}>Preview Article</button>
								</div>
								<div style={{display: 'inline-block'}}>
									<input type="submit" value="Submit Article" form="publish" />
								</div>
							</div>
						</div>
					</div>
				)}
			</div>		
		);
	}
}	
	

export default EditArticle;