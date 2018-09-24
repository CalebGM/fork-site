import React, { Component } from 'react';
import loadImage from 'blueimp-load-image';
import ShowLoading from './ShowLoading.js';
import styles from '../styles/mediaStyles.css';


class MediaAdd extends Component {
	constructor(props) {
		super(props);
		this.state = ({ url: '', open: false, loading: false });
		this.onClick = this.onClick.bind(this);
		this.getLocalImg = this.getLocalImg.bind(this);
	}
	
	componentDidMount() {
		document.addEventListener('click', this.closePopover.bind(this));
	}
	
	componentWillUnmount() {
		document.removeEventListener('click', this.closePopover.bind(this));
	}
	
	
	onPopoverClick() {
		this.preventNextClose = true;
	}
	
	openPopover() {
		if(!this.state.open) {
			this.preventNextClose = true;
			this.setState({open: true});
		}
	}
	
	closePopover() {
		if(!this.preventNextClose && this.state.open) {
			this.setState({open: false});
		}
		
		this.preventNextClose = false;
	}
	
	
	onClick() {
		this.input.value = null;
		this.input.click();
	}
	
    getLocalImg(e) {
        e.preventDefault();
        this.setState({ open: false, loading: true });
        var name = e.target.files[0].name;

        var loadingImage = loadImage(
            e.target.files[0],
            (img) => this.addLocalImage(img, name),
            { orientation: true }
        );
	}
	
    addLocalImage(localImage, imgName) {
        const { editorState, onChange } = this.props;

        localImage.toBlob((blob) => {
            var url = URL.createObjectURL(blob);
            onChange(this.props.modifier(editorState, url, { file: { image: blob, name: imgName } }));
            this.setState({ url: '', open: false, loading: false });
        }, 'image/jpeg', 0.5);
	}
	
	
    addOnlineMedia() {
        this.setState({ loading: true });
		const {editorState, onChange} = this.props;
		if(this.props.type === 'video') {
			onChange(this.props.modifier(editorState, {src: this.state.url}));
			this.setState({ url: '' });
        } else if (this.props.type === 'image') {
			onChange(this.props.modifier(editorState, this.state.url));
			this.setState({ url: '', loading: false });
		}
	}
	
	changeUrl(event) {
		this.setState({ url: event.target.value });
	}
	
	render() {
		const videoImage = (<i className="fa fa-youtube"></i>);
		const imageImage = (<i className="fa fa-photo"></i>);
		const addMediaImage = (this.props.type === 'video' ? videoImage : imageImage);
		
		const confirmButton = (this.props.type === 'video' ? 'Add Video' : 'Add Image');
		
		const chooseMedia = this.state.open ? styles.popoverOpen : styles.popoverClosed;
        const addUrl = this.state.open ? styles.urlOpen : styles.urlClosed;

		return (
			<div className={styles.Input} >
				<button className={chooseMedia} onMouseUp={this.openPopover.bind(this)} type="button">{addMediaImage}</button>
				<div className={addUrl} onClick={this.onPopoverClick.bind(this)}>
					<div>
						{this.props.type === 'image' ? (
							<button type="button" style={{marginBottom: '5px'}} onClick={this.onClick}>
								<i className="fa fa-save"></i>
								<input 
                                    type="file"
                                    accept="image/*"
									ref={(input) => { this.input =input; }}
									onChange={this.getLocalImg}
									style={{display: "none"}}
								/>
							</button>
						) : (
							<div></div>
						)}
					</div>
				
					<div>
					<input type="text" placeholder="Paste the url...." className='' onChange={this.changeUrl.bind(this)} value={this.state.url} />
					<button className='addMedia' type="button" onClick={this.addOnlineMedia.bind(this)} >{confirmButton}</button>
					</div>
					
                </div>
                <ShowLoading loading={this.state.loading} />
			</div>
		);
	}
}

export default MediaAdd;