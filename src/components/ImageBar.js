/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import ImageGallery from 'react-image-gallery';
import styles from '../styles/mediaStyles.css';
import '!style-loader!css-loader!react-image-gallery/styles/css/image-gallery.css';
import '!style-loader!css-loader!../styles/imgBarStyles.css';

class ImageBar extends React.Component {
	
	constructor(props) {
		super(props);
		this.state = { images: props.images ? props.images : [], url: '', open: false };
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
		const file = e.target.files[0];
		if (file.type.indexOf('image/') === 0) {
			const src = URL.createObjectURL(file);
			this.setState({ url: src },
				() => this.addLocalImage(file));
		}
	}
	
	addLocalImage(localImage) {
		const { images } = this.state;
		console.log(images);
		const {onChange} = this.props;
		var nextImg = { original: this.state.url, file: localImage };
		var newImages = images;
		newImages.push(nextImg);
		onChange(newImages);
		this.setState({ url: '', images: newImages });
	}
	
	
	addOnlineMedia () {
		const { images } = this.state;
		console.log(images);
		const {onChange} = this.props;
		var nextImg = { original: this.state.url };
		var newImages = images;
		newImages.push(nextImg);
		console.log(newImages);
		onChange(newImages);
		this.setState({ url: '', images: newImages });
	}
	
	changeUrl(event) {
		this.setState({ url: event.target.value });
	}
	
	onScreenChange(stuff) {
		if(stuff) {
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
	
	deletePictureControl() {
		if (this.state.images.length > 0) {
			return (<button 
						type='button' 
						className='image-gallery-delete'
						onClick={this.deletePicture.bind(this)}>
						<i className="fa fa-trash-o"></i>
						
					</button>);
		}
	}
	
	deletePicture() {
		const {onChange} = this.props;
		
		var index = this._imageGallery.getCurrentIndex();
		var newImages = this.state.images;
		newImages.splice(index, 1);
		this.setState({ images: newImages });
		this._imageGallery.slideToIndex(index === 0 ? index : index - 1);
		onChange(newImages);
	}
	
	
	render() {
		const { images } = this.state;
		const imageImage = (<i className="fa fa-photo"></i>);
		
		const chooseMedia = this.state.open ? styles.popoverOpen : styles.popoverClosed;
		const addUrl = this.state.open ? styles.urlOpen : styles.urlClosed;
		
		
		return (
			<div>
				<div className={styles.ImageBar}>
					{this.state.images.length > 0 ? (
						<ImageGallery
							items={images}
							showPlayButton={false}
							showFullscreenButton={images.length > 0 ? true : false}
							ref={i => this._imageGallery = i}
							onScreenChange={this.onScreenChange.bind(this)}
							renderCustomControls={this.deletePictureControl.bind(this)}
							
						/>
					) : (
						<div className={styles.EmptyBar}>
							<span>Add Pictures to Slideshow</span>
						</div>
					)}
				</div>
				<div className={styles.Input} >
					<button className={chooseMedia} onMouseUp={this.openPopover.bind(this)} type="button">{imageImage}</button>
					<div className={addUrl} onClick={this.onPopoverClick.bind(this)}>
						<div>
							<button type="button" style={{marginBottom: '5px'}} onClick={this.onClick}>
								<i className="fa fa-save"></i>
								<input 
									type="file" 
									ref={(input) => { this.input =input; }}
									onChange={this.getLocalImg}
									style={{display: "none"}}
								/>
							</button>
						</div>
					
						<div>
							<input type="text" placeholder="Paste the url...." className='' onChange={this.changeUrl.bind(this)} value={this.state.url} />
							<button className='addMedia' type="button" onClick={this.addOnlineMedia.bind(this)} >Add Image</button>
						</div>
						
					</div>
				</div>
			</div>
		)
	}
	
}

export default ImageBar;