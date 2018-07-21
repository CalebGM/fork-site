/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import Editor from 'draft-js-plugins-editor';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';

import createVideoPlugin from 'draft-js-video-plugin';
import createImagePlugin from 'draft-js-image-plugin';
import createFocusPlugin from 'draft-js-focus-plugin';
import { DefaultDraftBlockRenderMap, EditorState, convertFromRaw } from 'draft-js';
import createLinkifyPlugin from 'draft-js-linkify-plugin';
import '!style-loader!css-loader!draft-js-linkify-plugin/lib/plugin.css';
import createLinkPlugin from 'draft-js-link-plugin';
import '!style-loader!css-loader!draft-js-link-plugin/lib/plugin.css';
import '!style-loader!css-loader!draft-js/dist/Draft.css';

import editorStyles from '../styles/Editor.css';
import videoStyles from '../styles/Video.css';
import imageStyles from '../styles/Image.css';
import AnnouncementStyles from '../styles/Announcement.css';

var env = process.env.NODE_ENV || 'development';
var config = require('../config.js')[env];

const linkPlugin = createLinkPlugin({
    component: (props) => {
        const { contentState, ...rest } = props;
        // jsx-a11y/anchor-has-content
        return (<a {...rest} target="_blank" />);
    }
});
const linkifyPlugin = createLinkifyPlugin({
    component: (props) => {
        const { contentState, ...rest } = props;

        return (
            // jsx-a11y/anchor-has-content
            <a {...rest} target="_blank" />
        );
    }
});
const imagePlugin = createImagePlugin({ theme: imageStyles });
const focusPlugin = createFocusPlugin();
const videoPlugin = createVideoPlugin({ theme: videoStyles });


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

class Announcement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            article: EditorState.createEmpty(),
            ogArticle: EditorState.createEmpty(),
            id: props.match.params.id,
            title: props.match.params.title,
            created: '',
            updated: '',
            finished: false,
            unmounted: false,
        };
        this.onChange = (article) => this.setState({ article });
        this.onCancel = this.onCancel.bind(this);
        this.onPublish = this.onPublish.bind(this);
    }

    componentDidMount() {
        this.fetchAnnouncement();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.id !== nextProps.id) {
            this.setState({ id: nextProps.id },
                () => this.fetchAnnouncement());
        }
    }

    componentWillUnmount() {
        console.log('unmount');
        this.setState({ unmounted: true });
    }


    fetchAnnouncement() {
        fetch(config.url + "/getAnnouncement",
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: this.state.id, title: this.state.title }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                var cookedContent = convertFromRaw(JSON.parse(rs.body));
                var selArticle = EditorState.createWithContent(cookedContent);

                var postInfo = rs.info[0];

                var created = new Date(postInfo.Created);
                created = created.getMonth() + 1 + "/" + created.getDate() + "/" + created.getFullYear();

                var updated = new Date(postInfo.Created);
                updated = updated.getMonth() + 1 + "/" + updated.getDate() + "/" + updated.getFullYear();

                if (!this.state.unmounted) {
                    console.log(this.state.unmounted);
                    this.setState({
                        article: selArticle, finished: true,
                         created: created, updated: updated, inEdit: false
                    });
                }
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

    startAdd() {
        this.setState({ addPost: true });
    }

    cancelAdd() {
        this.setState({ addPost: false });
    }

    onScreenChange(stuff) {
        if (stuff) {
            var index = this._imageGallery.getCurrentIndex();
            console.log(index);
            var win = window.open(this.state.images[index].original, '_blank');
            if (win) {
                win.focus();
            } else {
                alert('Please allow popups for this website');
            }
        }
    }

    onCancel() {
        this.cancelEdit();
    }

    onPublish() {
        this.fetchArticle();
    }

    _focus() {
        this.editor.focus();
    }


    _onDeleteClick() {
        var result = window.confirm("Are you sure you want to delete this article?");
        if (result) {
            fetch(config.url + "/publish/deleteAnnouncement",
                {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: this.state.title, id: this.state.id }),
                    credentials: 'include'
                })
                .then((response) => {
                    if (response.status === 200) {
                        this.setState({ deleteRedirect: true });
                        alert("Article Successfully Deleted");
                    }
                })
                .catch((error) => {
                    console.log(error);
                })

        }
    }


    render() {
        const { login, admin } = this.props;
        const {article,
            title,
            created,
            updated,
            finished
        } = this.state;


        return (
            <DocumentTitle title={title + ' - Collaboration Treehouse'} >
                <div className={AnnouncementStyles.Entry}>
                            <div >
                                {login && admin ? (
                                    <button onClick={this._onDeleteClick.bind(this)}>Delete Article</button>
                                ) : (
                                        <div></div>
                                    )}

                                <div className={AnnouncementStyles.Article}>

                                    <div className={AnnouncementStyles.Title}>
                                        {title}
                                    </div>

                                    <div className={AnnouncementStyles.SubInfo}>

                                        <div className={AnnouncementStyles.Created}>
                                            {created}
                                        </div>
                                        <div className={AnnouncementStyles.Updated}>
                                            {updated}
                                        </div>
                                    </div>

                                    <div className={AnnouncementStyles.Body} onClick={this._focus.bind(this)}>
                                        {finished ? (
                                            <Editor
                                                editorState={article}
                                                plugins={plugins}
                                                onChange={this.onChange}
                                                blockRenderMap={extendedBlockRenderMap}
                                                ref={(element) => { this.editor = element; }}
                                                readOnly
                                            />
                                        ) : (
                                                <div></div>
                                            )}
                                    </div>
                                </div>

                            </div>
                </div>
            </DocumentTitle>
        );
    }
}


const mapStateToProps = state => {
    return {
        login: state.user.login,
        admin: state.user.admin
    }
}

export default connect(mapStateToProps)(Announcement)