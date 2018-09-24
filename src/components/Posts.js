/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import Editor from 'draft-js-plugins-editor';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import EditPost from './EditPost.js';
import AddPost from './AddPost.js';
import DisplayChildren from './DisplayChildren.js';
import ShowLoading from './ShowLoading.js';
import ImageGallery from 'react-image-gallery';

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
import ArticleStyles from '../styles/Article.css';
import PostStyles from '../styles/Post.css';

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

class Posts extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            article: EditorState.createEmpty(),
            ogArticle: EditorState.createEmpty(),
            postId: props.id,
            postTitle: props.title,
            title: props.article,
            isMobile: props.mobile,
            author: '',
            created: '',
            updated: '',
            images: [],
            childPosts: [],
            inEdit: false,
            addPost: false,
            finished: false,
            showNext: false,
            unmounted: false,
            shareFull: false,
            mobileShowOptions: false,
            postUrlSingle: encodeURI("https://collaborationtreehouse.com/story/" + props.article + "/id=" + props.articleId + "/at=" + props.title + "/id=" + props.id),
            postUrlFull: encodeURI("https://collaborationtreehouse.com/story/" + props.article + "/id=" + props.articleId + "/at=" + props.title + "/id=" + props.id + "/showFull"),
            loading: false
        };
        this.onChange = (article) => this.setState({ article });
        this.onCancel = this.onCancel.bind(this);
        this.onPublish = this.onPublish.bind(this);
    }

    componentDidMount() {
        console.log(this.props);
        window.twttr.widgets.load();
        this.setState({ loading: true });
        this.fetchPost();
        this.fetchChildren();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.id !== nextProps.id) {
            this.setState({ postId: nextProps.id, loading: true },
                () => this.fetchPost());
        }
    }

    componentWillUnmount() {
        console.log('unmount');
        this.setState({ unmounted: true });
    }


    fetchPost() {
        fetch(config.url + "/getContent",
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: this.state.postId, title: this.state.postTitle, source: "Post" }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                console.log(rs);
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
                        article: selArticle, ogArticle: selArticle, finished: true,
                        author: postInfo.Author, created: created, updated: updated, inEdit: false, loading: false
                    });
                }
            })
            .catch((error) => {
                console.log(error);
            });

        fetch(config.url + "/getImgBarMedia",
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: this.state.postId, title: this.state.postTitle, source: "Post" }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                if (!this.state.unmounted) {
                    console.log(rs);
                    this.setState({ images: rs.images });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }


    fetchChildren() {

        fetch(config.url + '/getChildPosts',
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: this.state.postId, isStart: false }),
                credentials: 'include'
            })
            .then((response) => response.json())
            .then((rs) => {
                console.log(rs);
                this.setState({ childPosts: rs.info });
            })
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


    showNext() {
        if (this.state.childPosts.length) {
            this.setState({ showNext: true });
        } else {
            this.fetchChildren();
        }
    }

    hideNext() {
        this.setState({ showNext: false });
    }

    toggleShare() {
        var shareFull = this.state.shareFull;
        this.setState({ shareFull: !shareFull }, () => {
            window.twttr.widgets.load();
        });
    }

    toggleMobileOptions() {
        var mobileShowOptions = this.state.mobileShowOptions;
        window.twttr.ready()
            .then(() => {
                window.twttr.widgets.load();
                this.setState({ mobileShowOptions: !mobileShowOptions });
            });

    }

    copyUrl(e) {
        var url = this.state.shareFull ? this.state.postUrlFull : this.state.postUrlSingle;
        var textarea = document.createElement("textarea");
        var copyURL = document.createTextNode(url);
        textarea.appendChild(copyURL);
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");
        } catch (ex) {
            console.log(ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }

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
        this.fetchPost();
    }

    _focus() {
        this.editor.focus();
    }


    render() {
        const { login, admin, articleId } = this.props;
        const { inEdit,
            showNext,
            addPost,
            article,
            title,
            author,
            created,
            finished,
            images,
            childPosts,
            postId,
            postTitle,
            postUrlSingle,
            postUrlFull,
            shareFull,
            mobileShowOptions,
            isMobile
        } = this.state;
        const editMode = (login && admin && inEdit);
        const mobileButton = isMobile ? ArticleStyles.MobileOptions : ArticleStyles.DisplayNone;
        var optionsBox;
        if (isMobile && mobileShowOptions) {
            optionsBox = ArticleStyles.OptionsBoxMobile;
        } else if (isMobile && !mobileShowOptions) {
            optionsBox = ArticleStyles.DisplayNone;
        } else {
            optionsBox = ArticleStyles.OptionsBoxDesktop;
        }

        return (
            <div className={ArticleStyles.Entry}>
               
                {editMode ? (
                    <EditPost
                        article={article}
                        title={postTitle}
                        id={postId}
                        author={author}
                        created={created}
                        images={images}
                        onCancel={this.onCancel}
                        onPublish={this.onPublish}

                    />
                ) : (
                    <div >
                        {login && admin ? (
                            <button onClick={this.startEdit.bind(this)}>Edit/Delete Article</button>
                        ) : (
                            <div></div>
                        )}

                        <div className={PostStyles.Article}>

                            <div className={PostStyles.Title}>
                                {postTitle}
                            </div>

                            <div className={PostStyles.SubInfo}>
                                <div className={PostStyles.Author}>
                                    <Link className={PostStyles.Link} to={`/auth/${this.state.author}/page=1`}>
                                        {this.state.author}
                                    </Link>
                                </div>
                             
                                <div className={PostStyles.Created}>
                                    {this.state.created}
                                </div>
                                <div className={PostStyles.Updated}>
                                    {this.state.updated}
                                </div>
                            </div>

                            <div className={PostStyles.ImageBarContainer}>
                                {images.length > 0 ? (
                                    <div className={PostStyles.ImageBar}>
                                        <ImageGallery
                                            items={images}
                                            showPlayButton={false}
                                            showBullets={images.length > 1 ? true : false}
                                            showThumbnails={false}
                                            showFullscreenButton={images.length > 0 ? true : false}
                                            ref={i => this._imageGallery = i}
                                            onScreenChange={this.onScreenChange.bind(this)}
                                        />
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                            </div>

                            <div className={PostStyles.Body} onClick={this._focus.bind(this)}>
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
                        <div className={mobileButton}>
                            <span>-----------</span>
                            <button onClick={this.toggleMobileOptions.bind(this)}><i className="fa fa-sort-down"></i></button>
                            <span>-----------</span>
                        </div>
                        <div className={optionsBox} >
                            <div className={ArticleStyles.ShareBox} >
                                <div className={ArticleStyles.ShareTabs} >
                                    <button
                                        onClick={this.toggleShare.bind(this)}
                                        disabled={!shareFull}
                                    >Share post</button>
                                    <button
                                        onClick={this.toggleShare.bind(this)}
                                        disabled={shareFull}
                                    >Share story</button>
                                </div>
                                <div className={ArticleStyles.ShareButtons} >
                                    {shareFull ? (
                                        <div>
                                            <iframe
                                                src={"https://www.facebook.com/plugins/share_button.php?href=" + postUrlFull + "&layout=button&size=small&mobile_iframe=true&width=59&height=20&appId"}
                                                width="59"
                                                height="20"
                                                style={{ border: 'none', overflow: 'hidden' }}
                                                scrolling="no"
                                                frameBorder="0"
                                                allowtransparency="true"
                                                allow="encrypted-media">
                                            </iframe>
                                        </div>
                                    ) : (
                                        <div>
                                           <iframe
                                                src={"https://www.facebook.com/plugins/share_button.php?href=" + postUrlSingle + "&layout=button&size=small&mobile_iframe=true&width=59&height=20&appId"}
                                                width="59"
                                                height="20"
                                                style={{ border: 'none', overflow: 'hidden' }}
                                                scrolling="no"
                                                frameBorder="0"
                                                allowtransparency="true"
                                                allow="encrypted-media">
                                            </iframe>

                                         </div>
                                            )}
                                        <div className={shareFull ? ArticleStyles.DisplayNone : ''}>
                                            <a
                                                href="https://twitter.com/share"
                                                data-url={postUrlSingle}
                                                className="twitter-share-button"
                                                data-show-count="false"
                                            >Tweet
                                            </a>
                                        </div>
                                        <div className={!shareFull ? ArticleStyles.DisplayNone : ''}>
                                            <a
                                                href="https://twitter.com/share"
                                                data-url={postUrlFull}
                                                className="twitter-share-button"
                                                data-show-count="false"
                                            >Tweet
                                            </a>
                                        </div>
                                    <button
                                        className={ArticleStyles.CopyLinkLarge}
                                        onClick={this.copyUrl.bind(this)}>Copy Link
                                    </button>
                                    <button
                                        className={ArticleStyles.CopyLinkSmall}
                                        onClick={this.copyUrl.bind(this)}>URL
                                    </button>
                                </div>
                            </div>
                                <div className={ArticleStyles.ChildBox}>
                                {showNext ? (
                                    <button 
                                        className={ArticleStyles.ChildButton} 
                                        onClick={this.hideNext.bind(this)}
                                        >
                                        Hide Next
                                    </button>
                                ) : (
                                    <button 
                                        className={ArticleStyles.ChildButton} 
                                        onClick={this.showNext.bind(this)}
                                        >
                                        Show Next ({childPosts.length})
                                    </button>
                                )}
                            </div>
                            <div className={ArticleStyles.PostBox}>
                                {addPost ? (
                                    <button
                                        className={ArticleStyles.PostButton}
                                        onClick={this.cancelAdd.bind(this)}
                                        >
                                        Cancel Post
                                    </button>
                                ) : (
                                    <button
                                        className={ArticleStyles.PostButton}
                                        onClick={this.startAdd.bind(this)}
                                        >
                                        Branch Off
                                    </button>
                                )}
                            </div>
                        </div>
                        {showNext ? (
                            <div>
                                <DisplayChildren
                                    childPosts={childPosts}
                                    parentId={postId}
                                    articleTitle={title}
                                    articleId={articleId}
                                />
                            </div>
                        ) : (
                            <div></div>
                        )}
                        {addPost ? (
                            <div>
                                <AddPost title={title} parentId={postId} start={false} articleId={articleId} />
                            </div>
                        ) : (
                            <div></div>
                        )}
                   </div>
                )}
            </div>
        )
    }
}


const mapStateToProps = state => {
    return {
        login: state.user.login,
        admin: state.user.admin
    }
}

export default connect(mapStateToProps)(Posts)