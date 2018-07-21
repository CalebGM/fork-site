/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import DocumentTitle from 'react-document-title';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { setRedirectUrl } from '../actions';

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
import 'draft-js-image-plugin/lib/plugin.css';

import MediaAdd from './MediaAdd.js';
import LogoAdd from './LogoAdd.js';
import ImageBar from './ImageBar.js';
import Preview from './Preview.js';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];


const linkPlugin = createLinkPlugin({
	component: (props) => {
		const { contentState, ...rest} = props;
		// jsx-a11y/anchor-has-content
		return (<a {...rest} target="_blank"/>);
	}
});
const linkifyPlugin = createLinkifyPlugin({
	component: (props) => {
		const { contentState, ...rest} = props;
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


const plugins = [focusPlugin, videoPlugin, toolbarPlugin, linkifyPlugin, imagePlugin, linkPlugin];
const categories = config.categories;
const tabCharacter = "	";

class Publish extends React.Component {
	constructor(props) {
		super(props);
		this.state = {editorStateTitle: EditorState.createEmpty(),
						editorStateBody: EditorState.createEmpty(),
						title: '',
						author: props.login ? props.username : 'Guest',
						category: new Set(),
						preview: false,
						finishPublish: false,
						fetches: {},
						logoImg: null,
                        images: [],
                        articleId: null
					};
		this.onChangeTitle = (editorStateTitle) => this.setState({editorStateTitle});
		this.onChangeBody = (editorStateBody) => this.setState({editorStateBody});
		this.modifyLogo = this.modifyLogo.bind(this);
		this.modifyImageBar = this.modifyImageBar.bind(this);
		this.createCheckbox = this.createCheckbox.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleAuthorChange = this.handleAuthorChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);
		this.handlePastedText = this.handlePastedText.bind(this);
		this.onTab = this.onTab.bind(this);
	}
	
	
	componentDidMount() {
		const { login, dispatch, currentURL } = this.props;
		
		if (!login) {
			dispatch(setRedirectUrl(currentURL));
		}
	}
	
	handleKeyCommand(command) {
		const newState = RichUtils.handleKeyCommand(this.state.editorStateBody, command);
		if (newState) {
			this.onChangeBody(newState);
			return 'handled';
		}
		return 'not-handled';
	}
	
	
	onTab(e) {
		e.preventDefault();

		let currentState = this.state.editorStateBody;
		let newContentState = Modifier.replaceText(
		  currentState.getCurrentContent(),
		  currentState.getSelection(),
		  tabCharacter
		);

		this.setState({editorStateBody: EditorState.push(currentState, newContentState, 'insert-characters')});
	}
	
	handlePastedText(text) {
		const { editorStateBody } = this.state;
		const pastedBlocks = ContentState.createFromText(text).blockMap;
		const newState = Modifier.replaceWithFragment(
			editorStateBody.getCurrentContent(),
			editorStateBody.getSelection(),
			pastedBlocks
		);
		this.onChangeBody(EditorState.push(editorStateBody, newState, 'insert-fragment'));
		return 'handled';
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
			
			var cats = formData.getAll('cat');
			var title = formData.get('title');
			var firstBlock = articleContent.getFirstBlock();
			var nextBlock = articleContent.getBlockAfter(firstBlock.key);
			
			while (nextBlock) {
				let key = nextBlock.getEntityAt(0);
				if (key) {
					let entity = articleContent.getEntity(key);
					if (entity.type === "image") {
						let fetches = this.state.fetches;
						fetches[key] = entity;
						this.setState({ fetches: fetches });
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
			
			if (this.state.logoImg) {
				var logoImgRequest = this.uploadLogoImage();
				promises.push(logoImgRequest);
			}
			
			if (this.state.images.length > 0) {
				for (var i = 0; i < this.state.images.length; i++) {
					let imgBarRequest = this.uploadImgBar(this.state.images[i]);
					promises.push(imgBarRequest);
				}
			}
			
			
            Promise.all(promises).then(() => {
                var login = this.props.login;
                var username = this.props.username;
				var articleContentImg = this.state.editorStateBody.getCurrentContent();
				var articleRaw = convertToRaw(articleContentImg);
				fetch(config.url + "/admin/publish/postArticle",
				{
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
                    body: JSON.stringify({
                        categories: cats,
                        title: title,
                        author: username,
                        article: articleRaw,
                        login: login
                    }),
					credentials: 'include'
				})
                    .then((response) => response.json())
                    .then((rs) => {
                        console.log(rs);
						this.setState({ finishPublish: true, articleId: rs.articleId });
					})
					.catch((error) => {
						console.log(error);
					});
			});
		}
	}
	
	uploadLogoImage() {
		const { logoImg, title } = this.state;
		var junkBlob = new Blob(['sup'], {type: 'text/plain'});
		
		if (logoImg.file) {
			let localFile = new FormData();
			localFile.append('file', logoImg.file, 'logo');
			localFile.append('title', junkBlob, title);
			localFile.append('logo', junkBlob);
			
			return fetch(config.url + "/admin/publish/uploadLocalImage",
				{
					method: 'post',
					body: localFile,
					credentials: 'include'
				})
					.then((response) => response.json())
					.then((rs) => {
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
				body: JSON.stringify({ url: logoImg.original, title: title, logo: true }),
				credentials: 'include'
			})
				.then((response) => response.json())
				.then((rs) => {
				})
				.catch((error) => {
					console.log(error);
				});
		}
	}
	
	uploadImgBar(image) {
		const { title } = this.state;
		var junkBlob = new Blob(['sup'], {type: 'text/plain'});
		if (image.file) {
			let localFile = new FormData();
			localFile.append('file', image.file);
			localFile.append('title', junkBlob, title);
			localFile.append('imgBar', junkBlob);
			
			return fetch(config.url + "/admin/publish/uploadLocalImage",
				{
					method: 'post',
					body: localFile,
					credentials: 'include'
				})
					.then((response) => response.json())
					.then((rs) => {
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
				body: JSON.stringify({ url: image.original, title: title, imgBar: true }),
				credentials: 'include'
			})
				.then((response) => response.json())
				.then((rs) => {
				})
				.catch((error) => {
					console.log(error);
				});
		}
	}
	
	uploadDraftImage(key, entityObject, articleContent) {
		let entity = entityObject[key];
		let oldUrl = entity.data.src;
		var junkBlob = new Blob(['sup'], {type: 'text/plain'});
		if (entity.data.file) {
			let localFile = new FormData();
			localFile.append('file', entity.data.file);
			localFile.append('title', junkBlob, this.state.title);
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
				body: JSON.stringify({ url: oldUrl, title: this.state.title, draft: true }),
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
	
	_focus = () => {
		this.editor.focus();
	}
	
	modifyLogo(newLogo) {
		this.setState({ logoImg: newLogo });
	}
	
	modifyImageBar(newImages) {
		console.log(newImages);
		this.setState({ images: newImages });
		console.log(this.state.images);
	}
	
	render() {
		const { login, username } = this.props;
        const { finishPublish, title, articleId } = this.state;

        const AuthorName = login ? username : "Guest";
		
		if (!login) {
			//return <Redirect to={`admin`} />;
        }
        if (finishPublish) {
            return <Redirect to={`/story/${title}/id=${articleId}`} />;
		}
		
        return (
            <DocumentTitle title={'Start New Story - Collaboration Treehouse'}>
                <div className={editorStyles.publishBody} >
				{this.state.preview ? (
					<div>
						<Preview 
							article={this.state.editorStateBody}
							title={this.state.title}
							categories={this.state.category}
							author={AuthorName}
							images={this.state.images}
						/>
						<div style={{textAlign: 'left'}}>
							<button onClick={this._onEditClick.bind(this)}>Back To Edits</button>
						</div>
					</div>
				) : (
					<div>
						<div>
							<h1>Start Your Story</h1>
                        </div>

                        {!login ? (
                                <div style={{ color: '#0338ff', paddingBottom: '5px' }}>
                                    <span>You're currently not logged in. You'll still be able to post, but you won't
                                        be able to track your contributions. Sign Up or Login </span>
                                    <Link to="/login">here</Link>
                                    <span>, or continue as a Guest.</span>
                                </div>
                        ) : (
                                <div></div>
                        )}
						
						<form className={editorStyles.form} name="publish" id="publish" onSubmit={this.handleSubmit} >
							
							<input className={editorStyles.TitleInputBig}
								type="text"
								name="title"
								value={this.state.title}
								placeholder="Give your article a unique title..."
								onChange={this.handleTitleChange}
								required 
                                />
                            <input className={editorStyles.TitleInputSmall}
                                type="text"
                                name="title"
                                value={this.state.title}
                                placeholder="Your title..."
                                onChange={this.handleTitleChange}
                                required
                                />
							<div className={editorStyles.SubInfo}>
                                    <div className={editorStyles.AuthorInput}>
                                        {AuthorName}
                                        {/*<input type="text"
										name="author"
										value={this.state.author}
										placeholder="Write the author's name..."
										onChange={this.handleAuthorChange}
										required
									/>*/}
								</div>
								<fieldset className={editorStyles.checkField} >
									{this.createCheckboxes()}	
								</fieldset>
							</div>
						</form>
						
						<div className={editorStyles.PictureSpace}>
							<div className={editorStyles.LogoAdd}>
								<LogoAdd
									onChange={this.modifyLogo}
								/>
							</div>
							<div className={editorStyles.ImageBarAdd}>
								<ImageBar
									onChange={this.modifyImageBar}
								/>
							</div>
						</div>
						
						<br />
						<br />
						
						<div className={editorStyles.buttons}>
							<button className={editorStyles.button} onClick={this._onBoldClick.bind(this)}>Bold</button>
							<button className={editorStyles.button} onClick={this._onItalicizeClick.bind(this)}>Italic</button>
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

						<div className={editorStyles.editor} >
							<Editor 
								editorState = {this.state.editorStateBody} 
								handleKeyCommand={this.handleKeyCommand}
								handlePastedText={this.handlePastedText}
								onTab={this.onTab}
								blockRenderMap={extendedBlockRenderMap}
								onChange={this.onChangeBody} 
								plugins={plugins}
								textAlign='left'
								//ref={(element) => { this.editor = element; }}
								placeholder='Write the rest of your article.....'
							/>
							<Toolbar />
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
                    )}
            </div>
			</DocumentTitle>		
		);
	}
}	
	
	
const mapStateToProps = (state, ownProps) => {
	return {
        login: state.user.login,
        username: state.user.username,
		currentURL: ownProps.location.pathname
	}
}
	
	
	

export default connect(mapStateToProps)(Publish)