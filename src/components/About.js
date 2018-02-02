/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import { connect } from 'react-redux';
import Editor from 'draft-js-plugins-editor';
import { DefaultDraftBlockRenderMap, EditorState, convertFromRaw } from 'draft-js';
import Immutable from 'immutable';
import DocumentTitle from 'react-document-title';
import EditAbout from './EditAbout.js';


import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import '!style-loader!css-loader!draft-js-linkify-plugin/lib/plugin.css';
import createLinkPlugin from 'draft-js-link-plugin';
import '!style-loader!css-loader!draft-js-link-plugin/lib/plugin.css';


import editorStyles from '../Editor.css';
import videoStyles from '../Video.css';
import imageStyles from '../Image.css';
import aboutStyles from '../AboutUs.css';


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
		
		return (
			// jsx-a11y/anchor-has-content
			<a {...rest} target="_blank"/>
		);
	}
});
const imagePlugin = createImagePlugin({ theme: imageStyles });
const focusPlugin = createFocusPlugin();
const videoPlugin = createVideoPlugin({theme: videoStyles});


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


const plugins = [focusPlugin, videoPlugin, linkifyPlugin, imagePlugin, linkPlugin];


class About extends React.Component {
	constructor(props) {
		super(props);
		this.state = { body: EditorState.createEmpty(), inEdit: false };
		this.onChange = (article) => this.setState({article});
		this.onCancel = this.onCancel.bind(this);
		this.onPublish = this.onPublish.bind(this);
	}
	
	componentDidMount() {
		this.fetchAboutUs();
	}
	
	fetchAboutUs() {
		fetch(config.url + "/getAboutPage",
		{
			method: 'get'
		})
			.then((response) => response.json())
			.then((rs) => {
				var cookedContent = convertFromRaw(JSON.parse(rs.body));
				var aboutUs = EditorState.createWithContent(cookedContent);
				this.setState({ body: aboutUs, inEdit: false });
			})
			.catch((error) => {
				console.log(error);
			});
	}
	
	startEdit() {
		this.setState({ inEdit: true });
	}
	
	cancelEdit() {
		this.setState({ inEdit: false });
	}
	
	onCancel() {
		this.cancelEdit();
	}
	
	onPublish() {
		this.fetchAboutUs();
	}
	
	
	render() {
		const { login } = this.props;
		const { body, inEdit } = this.state;
		const editMode = login && inEdit;
		
		return (
			<DocumentTitle title={'About Us - Awesome Totally Awesome'}>
			<div>
				{editMode ? (
					<EditAbout
						body={body}
						onCancel={this.onCancel}
						onPublish={this.onPublish}
					/>
				) : (
					<div className={aboutStyles.About}>
						{login ? (
							<button onClick={this.startEdit.bind(this)}>Edit About Us</button>
						) : (
							<div></div>
						)}
						<div className={aboutStyles.Title}>About Us</div>
						<div className={aboutStyles.Body} >
							<Editor
								editorState={body}
								plugins={plugins}
								blockRenderMap={extendedBlockRenderMap}
								onChange={this.onChange}
								readOnly
							/>
						</div>
					</div>
				)}
			</div>
			</DocumentTitle>
		)
	}
}

const mapStateToProps = state => {
	return {
		login: state.login
	}
}

export default connect(mapStateToProps)(About)